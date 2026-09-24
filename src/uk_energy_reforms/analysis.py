"""Impact, eligibility, cliff-edge and breakdown measures for a targeted energy discount.

Scope is Great Britain (the scheme's scope) unless noted. The relative poverty line is
60% of the baseline UK person-weighted median of equivalised household income, held
fixed for the reform: the discount is a temporary transfer, and on heavily weighted
data a recomputed median can move by more than the transfer itself. Absolute poverty
is policyengine-uk's fixed line
(``in_poverty_bhc`` / ``in_poverty_ahc``: 2010-11 HBAI line uprated by CPI). Income
deciles rank GB people by baseline equivalised AHC income (RF's Figure 3 basis).
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from uk_energy_reforms.household_types import HOUSEHOLD_TYPES
from uk_energy_reforms.simulate import Run

REGIONS = [
    "NORTH_EAST",
    "NORTH_WEST",
    "YORKSHIRE",
    "EAST_MIDLANDS",
    "WEST_MIDLANDS",
    "EAST_OF_ENGLAND",
    "LONDON",
    "SOUTH_EAST",
    "SOUTH_WEST",
    "WALES",
    "SCOTLAND",
]

REGION_LABELS = {
    "NORTH_EAST": "North East",
    "NORTH_WEST": "North West",
    "YORKSHIRE": "Yorkshire and the Humber",
    "EAST_MIDLANDS": "East Midlands",
    "WEST_MIDLANDS": "West Midlands",
    "EAST_OF_ENGLAND": "East of England",
    "LONDON": "London",
    "SOUTH_EAST": "South East",
    "SOUTH_WEST": "South West",
    "WALES": "Wales",
    "SCOTLAND": "Scotland",
}

GROUPS = {"region": REGIONS, "household_type": HOUSEHOLD_TYPES}
MARGINAL_RATE = 0.28  # basic-rate income tax plus employee NI, for dead zones
HIGH_BURDEN = 0.10  # energy spend above 10% of net income (old fuel-poverty test)


def _weighted_quantile(values, weights, q):
    order = np.argsort(values, kind="stable")
    cum = np.cumsum(weights[order])
    return float(values[order][np.searchsorted(cum, q * cum[-1])])


def _deciles(values, weights):
    """Decile by the share of people with lower income (weights are people)."""
    order = np.argsort(values, kind="stable")
    w = weights[order]
    below = (np.cumsum(w) - w) / w.sum()
    out = np.empty(len(values), dtype=int)
    out[order] = np.minimum((below * 10 + 1e-9).astype(int) + 1, 10)
    return out


def prepare(run: Run) -> pd.DataFrame:
    """The run's frame with deciles, relative poverty and struggling flags added."""
    f = run.frame.copy()
    people = (f.weight * f.n_people).values
    for basis in ["bhc", "ahc"]:
        line = 0.6 * _weighted_quantile(f[f"eq_{basis}_base"].values, people, 0.5)
        for scen in ["base", "reform"]:
            f[f"rel_pov_{basis}_{scen}"] = f[f"eq_{basis}_{scen}"].values < line
    for column in [c for c in f.columns if c.startswith("abs_pov_")]:
        f[column] = f[column].astype(bool)
    gb = f.gb.values
    for basis in ["bhc", "ahc"]:
        dec = np.zeros(len(f), dtype=int)
        dec[gb] = _deciles(f[f"eq_{basis}_base"].values[gb], people[gb])
        f[f"decile_{basis}"] = dec
    f["bottom4"] = f.decile_ahc.between(1, 4)
    net = f.net_bhc_base.values
    f["high_burden"] = np.where(net > 0, f.bill / np.maximum(net, 1), 1.0) > HIGH_BURDEN
    f["struggling"] = f.abs_pov_ahc_base | f.rel_pov_ahc_base | f.high_burden
    f["gain"] = f.net_bhc_reform - f.net_bhc_base
    f["recipient"] = f.discount > 0
    f["income_only"] = f.eligible & ~f.passported
    return f[f.gb]


def _w(f, mask=None):
    return float(f.weight[mask].sum()) if mask is not None else float(f.weight.sum())


def _share(f, mask, base=None):
    base = np.ones(len(f), bool) if base is None else np.asarray(base)
    denom = f.weight[base].sum()
    return float(f.weight[np.asarray(mask) & base].sum() / denom) if denom else np.nan


def _ess(weights):
    w = np.asarray(weights, dtype=float)
    return float(w.sum() ** 2 / (w**2).sum()) if len(w) else 0.0


def paid_bracket(f: pd.DataFrame, schedule: dict) -> np.ndarray:
    thresholds = schedule["rate_thresholds" if schedule["unit_rate"] else "thresholds"]
    return np.searchsorted(np.asarray(thresholds), f.assessed_income, side="right") - 1


def headline(run: Run, f: pd.DataFrame | None = None) -> dict:
    f = prepare(run) if f is None else f
    w = f.weight
    total = float((f.discount * w).sum())
    recipients = _w(f, f.recipient)
    bracket = paid_bracket(f, run.schedule)
    by_bracket = {}
    for i in sorted(set(bracket[f.recipient.values])):
        m = f.recipient.values & (bracket == i)
        by_bracket[str(i)] = {
            "recipients_m": _w(f, m) / 1e6,
            "cost_bn": float((f.discount * w)[m].sum() / 1e9),
            "average": float(np.average(f.discount[m], weights=w[m])),
        }
    return {
        "gb_households_m": _w(f) / 1e6,
        "cost_bn": total / 1e9,
        "recipients_m": recipients / 1e6,
        "recipient_share": recipients / _w(f),
        "average_per_recipient": total / recipients if recipients else 0.0,
        "eligible_share": _share(f, f.eligible),
        "passported_share": _share(f, f.passported),
        "income_test_share": _share(f, f.income_route),
        "income_only_share": _share(f, f.income_only),
        "cost_passported_bn": float((f.discount * w)[f.passported].sum() / 1e9),
        "cost_income_only_bn": float((f.discount * w)[f.income_only].sum() / 1e9),
        "by_bracket": by_bracket,
        "hbai_income_change_bn": float((f.gain * w).sum() / 1e9),
    }


def deciles(run: Run, f: pd.DataFrame | None = None, basis: str = "ahc") -> list:
    f = prepare(run) if f is None else f
    rows = []
    for d in range(1, 11):
        m = f[f"decile_{basis}"] == d
        g = f[m]
        rows.append(
            {
                "decile": d,
                "households_m": _w(g) / 1e6,
                "share_receiving": _share(g, g.recipient),
                "average_gain": float(np.average(g.gain, weights=g.weight)),
                "gain_pct_net_income": float(
                    (g.gain * g.weight).sum() / (g.net_bhc_base * g.weight).sum()
                ),
            }
        )
    return rows


POVERTY_GROUPS = {
    "people": "n_people",
    "children": "n_children",
    "working_age_adults": "n_wa_adults",
    "pensioners": "n_sp_age",
}


def poverty(run: Run, f: pd.DataFrame | None = None) -> list:
    f = prepare(run) if f is None else f
    rows = []
    for measure in ["abs_pov_bhc", "abs_pov_ahc", "rel_pov_bhc", "rel_pov_ahc"]:
        for group, count in POVERTY_GROUPS.items():
            people = f.weight * f[count]
            base = float((people * f[f"{measure}_base"]).sum())
            reform = float((people * f[f"{measure}_reform"]).sum())
            total = float(people.sum())
            rows.append(
                {
                    "measure": measure,
                    "group": group,
                    "baseline_rate": base / total,
                    "reform_rate": reform / total,
                    "change_pp": 100 * (reform - base) / total,
                    "change_k": (reform - base) / 1e3,
                }
            )
    return rows


def coverage(run: Run, f: pd.DataFrame | None = None) -> list:
    """How much of each struggling group the scheme reaches, and how many it misses."""
    f = prepare(run) if f is None else f
    rows = []
    for label, mask in {
        "absolute AHC poverty": f.abs_pov_ahc_base,
        "relative AHC poverty": f.rel_pov_ahc_base,
        "poorest four AHC deciles": f.bottom4,
        "energy over 10% of net income": f.high_burden,
    }.items():
        rows.append(
            {
                "group": label,
                "households_m": _w(f, mask) / 1e6,
                "covered_by_passport": _share(f, f.passported, mask),
                "covered": _share(f, f.recipient, mask),
                "missed_m": _w(f, mask & ~f.recipient) / 1e6,
                "missed_by_type_m": {
                    t: _w(f, mask & ~f.recipient & (f.household_type == t)) / 1e6
                    for t in HOUSEHOLD_TYPES
                },
                "missed_by_region_m": {
                    r: _w(f, mask & ~f.recipient & (f.region == r)) / 1e6
                    for r in REGIONS
                },
            }
        )
    return rows


def _support_below(f: pd.DataFrame, schedule: dict, threshold: float) -> np.ndarray:
    """Support each household would get if its assessed income were just below."""
    if schedule["unit_rate"]:
        t = np.asarray(schedule["rate_thresholds"])
        rate = np.asarray(schedule["rates"])[np.searchsorted(t, threshold, "right") - 2]
        return rate * f.bill.values
    t = np.asarray(schedule["thresholds"])
    amount = np.asarray(schedule["amounts"])[np.searchsorted(t, threshold, "right") - 2]
    return np.full(len(f), amount)


def cliff_thresholds(schedule: dict) -> list:
    """Thresholds where support falls as assessed income crosses them.

    Without the income test, income moves no household on or off the schedule
    (passported households are placed at their passport income), so there are none.
    """
    if not schedule.get("income_test", True):
        return []
    t = schedule["rate_thresholds" if schedule["unit_rate"] else "thresholds"]
    v = schedule["rates" if schedule["unit_rate"] else "amounts"]
    return [t[i] for i in range(1, len(t)) if v[i] < v[i - 1]]


def cliffs(
    run: Run,
    f: pd.DataFrame | None = None,
    marginal_rate: float = MARGINAL_RATE,
) -> list:
    """Households just above each threshold where support drops.

    Only households placed on the schedule by their own income can cross a threshold;
    passported households placed at a lower assessed income are unaffected.
    """
    f = prepare(run) if f is None else f
    exposed = (f.assessed_income == f.tested_income).values
    rows = []
    for t in cliff_thresholds(run.schedule):
        below = _support_below(f, run.schedule, t)
        drop = np.maximum(below - f.discount.values, 0)
        income = f.tested_income.values
        row = {"threshold": t, "bands": {}}
        for label, lo, hi in [
            ("1000_below", t - 1000, t),
            ("500_above", t, t + 500),
            ("1000_above", t, t + 1000),
            ("2000_above", t, t + 2000),
        ]:
            m = exposed & (income >= lo) & (income < hi)
            g = f[m]
            row["bands"][label] = {
                "households_k": _w(g) / 1e3,
                "sample_n": int(m.sum()),
                "ess": _ess(g.weight),
                "bottom4_k": _w(g, g.bottom4) / 1e3,
                "abs_ahc_poor_k": _w(g, g.abs_pov_ahc_base) / 1e3,
                "rel_ahc_poor_k": _w(g, g.rel_pov_ahc_base) / 1e3,
                "mean_eq_ahc": float(np.average(g.eq_ahc_base, weights=g.weight))
                if len(g)
                else np.nan,
                "mean_bill": float(np.average(g.bill, weights=g.weight))
                if len(g)
                else np.nan,
            }
        above = exposed & (income >= t)
        near = above & (income < t + 1000)
        width = drop / (1 - marginal_rate)
        dead = above & (income < t + width) & (drop > 0)
        row["mean_drop"] = (
            float(np.average(drop[near], weights=f.weight[near])) if near.any() else 0.0
        )
        row["dead_zone_k"] = _w(f, dead) / 1e3
        row["dead_zone_struggling_k"] = _w(f, dead & f.struggling.values) / 1e3
        row["dead_zone_median_width"] = (
            float(np.median(width[above & (drop > 0)]))
            if (above & (drop > 0)).any()
            else 0.0
        )
        rows.append(row)
    return rows


def breakdown(run: Run, by: str, f: pd.DataFrame | None = None) -> pd.DataFrame:
    """Key results by region or household type."""
    f = prepare(run) if f is None else f
    total_cost = float((f.discount * f.weight).sum())
    exposed = (f.assessed_income == f.tested_income).values
    top = max(cliff_thresholds(run.schedule) or [np.inf])
    near_top = exposed & (f.tested_income >= top) & (f.tested_income < top + 1000)
    below_top = _support_below(f, run.schedule, top) if np.isfinite(top) else 0
    drop = np.maximum(below_top - f.discount.values, 0)
    dead = (
        exposed
        & (f.tested_income >= top)
        & (f.tested_income < top + drop / (1 - MARGINAL_RATE))
        & (drop > 0)
    )
    people = f.weight * f.n_people
    rows = []
    for group in GROUPS[by]:
        m = (f[by] == group).values
        g = f[m]
        cost = float((g.discount * g.weight).sum())
        recipients = _w(g, g.recipient)
        poor = g.abs_pov_ahc_base
        rows.append(
            {
                by: REGION_LABELS.get(group, group),
                "households_m": _w(g) / 1e6,
                "sample_n": int(m.sum()),
                "ess": _ess(g.weight),
                "eligible_rate": _share(g, g.eligible),
                "passported_rate": _share(g, g.passported),
                "income_test_rate": _share(g, g.income_route),
                "recipients_m": recipients / 1e6,
                "cost_m": cost / 1e6,
                "cost_share": cost / total_cost if total_cost else np.nan,
                "average_per_recipient": cost / recipients if recipients else 0.0,
                "gain_pct_net_income": float(
                    (g.gain * g.weight).sum() / (g.net_bhc_base * g.weight).sum()
                ),
                "mean_bill": float(np.average(g.bill, weights=g.weight)),
                "abs_ahc_poverty_rate": _share(g, poor),
                "abs_ahc_poor_covered": _share(g, g.recipient, poor),
                "abs_ahc_poor_missed_k": _w(g, poor & ~g.recipient) / 1e3,
                "rel_ahc_poor_missed_k": _w(g, g.rel_pov_ahc_base & ~g.recipient) / 1e3,
                "bottom4_missed_k": _w(g, g.bottom4 & ~g.recipient) / 1e3,
                "people_out_of_rel_ahc_poverty_k": float(
                    (people[m] * (g.rel_pov_ahc_base & ~g.rel_pov_ahc_reform)).sum()
                    - (people[m] * (~g.rel_pov_ahc_base & g.rel_pov_ahc_reform)).sum()
                )
                / 1e3,
                "people_out_of_abs_ahc_poverty_k": float(
                    (people[m] * (g.abs_pov_ahc_base & ~g.abs_pov_ahc_reform)).sum()
                    - (people[m] * (~g.abs_pov_ahc_base & g.abs_pov_ahc_reform)).sum()
                )
                / 1e3,
                "just_above_top_threshold_k": _w(f, m & near_top) / 1e3,
                "just_above_bottom4_k": _w(f, m & near_top & f.bottom4.values) / 1e3,
                "dead_zone_k": _w(f, m & dead) / 1e3,
            }
        )
    return pd.DataFrame(rows)
