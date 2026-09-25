"""Collect results for a set of scenarios and render them as JSON and a markdown receipt."""

from __future__ import annotations

import json
import math
from pathlib import Path

import pandas as pd

from uk_energy_reforms import analysis, calibrate
from uk_energy_reforms.datasets import DATASETS
from uk_energy_reforms.reforms.targeted_energy_discount import DESCRIPTIONS, preset
from uk_energy_reforms.simulate import Run, run


def results_for(r: Run, distributions: bool = False) -> dict:
    """Every measure for one run. ``distributions`` adds eligibility across income
    measures, which depends only on eligibility, so it is computed for the run at the
    published amounts and not repeated for the bill-share and budget variants."""
    f = analysis.prepare(r)
    out = {
        "dataset": r.dataset,
        "year": r.year,
        "take_up": r.take_up,
        "changes": r.changes,
        "schedule": r.schedule,
        "headline": analysis.headline(r, f),
        "baseline": analysis.baseline_summary(r, f),
        "inequality": analysis.inequality(r, f),
        "winners_losers": analysis.winners_losers(r, f),
        "deciles_ahc": analysis.deciles(r, f, "ahc"),
        "poverty": analysis.poverty(r, f),
        "coverage": analysis.coverage(r, f),
        "cliffs": analysis.cliffs(r, f),
        "by_region": analysis.breakdown(r, "region", f).to_dict(orient="records"),
        "by_household_type": analysis.breakdown(r, "household_type", f).to_dict(
            orient="records"
        ),
    }
    if distributions:
        out["income_distributions"] = analysis.income_distributions(r, f)
    return out


def scenarios(
    datasets: list[str],
    year: int,
    presets: list[str],
    bill_share: bool = False,
    budget: float | None = None,
    take_up: float = 1.0,
) -> dict:
    """Run every preset (and its bill-share and budget variants) on every dataset."""
    out: dict = {}
    for dataset in datasets:
        for name in presets:
            fixed = run(dataset, year, preset(name), take_up=take_up)
            out.setdefault(name, {})[dataset] = results_for(fixed, distributions=True)
            if bill_share:
                rate = run(
                    dataset, year, calibrate.bill_share_changes(fixed), take_up=take_up
                )
                out.setdefault(f"{name}_bill_share", {})[dataset] = results_for(rate)
            if budget:
                scaled = run(
                    dataset,
                    year,
                    calibrate.budget_changes(fixed, budget),
                    take_up=take_up,
                )
                key = f"{name}_budget_{budget / 1e9:g}bn"
                out.setdefault(key, {})[dataset] = results_for(scaled)
    return out


def _clean(value):
    if isinstance(value, dict):
        return {str(k): _clean(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_clean(v) for v in value]
    if isinstance(value, float) and math.isnan(value):
        return None
    if hasattr(value, "item"):
        return _clean(value.item())
    return value


def write_json(results: dict, path: Path) -> None:
    path.write_text(json.dumps(_clean(results), indent=1))


def _table(rows: list[dict], columns: dict) -> str:
    df = pd.DataFrame(rows)[list(columns)]
    head = "| " + " | ".join(columns.values()) + " |"
    rule = "|" + "|".join(["---"] * len(columns)) + "|"
    body = []
    for _, row in df.iterrows():
        cells = []
        for column, value in row.items():
            if isinstance(value, str):
                cells.append(value)
            elif any(s in column for s in ("rate", "share", "covered", "pct")):
                cells.append(f"{100 * value:.1f}%")
            elif column in ("sample_n", "decile"):
                cells.append(f"{int(value):,}")
            elif abs(value) < 10:
                cells.append(f"{value:,.2f}")
            elif abs(value) < 100:
                cells.append(f"{value:,.1f}")
            else:
                cells.append(f"{value:,.0f}")
        body.append("| " + " | ".join(cells) + " |")
    return "\n".join([head, rule, *body])


BREAKDOWN_COLUMNS = {
    "households_m": "Households (m)",
    "ess": "ESS",
    "eligible_rate": "Eligible",
    "passported_rate": "Passported",
    "income_test_rate": "Pass income test",
    "cost_m": "Cost (GBP m)",
    "cost_share": "Share of cost",
    "average_per_recipient": "Avg per recipient (GBP)",
    "gain_pct_net_income": "Gain, % net income",
    "mean_bill": "Mean bill (GBP)",
    "abs_ahc_poverty_reached": "In abs. AHC poverty, reached",
    "abs_ahc_poverty_not_reached_k": "In abs. AHC poverty, not reached (k)",
    "bottom4_not_reached_k": "Lowest-4-decile, not reached (k)",
    "people_out_of_rel_ahc_poverty_k": "People out of rel. AHC poverty (k)",
    "just_above_top_threshold_k": "Within GBP 1k above top line (k)",
    "offset_range_k": "Offset range (k)",
}


DISTRIBUTION_LABELS = {
    "eq_bhc": "equivalised net income, before housing costs",
    "eq_ahc": "equivalised net income, after housing costs",
    "net_bhc": "household net income, before housing costs (not equivalised)",
    "net_ahc": "household net income, after housing costs (not equivalised)",
    "taxable": "household taxable income (members' total_income summed)",
}


def _distribution_lines(d: dict) -> list:
    """Eligibility by household decile on two measures, and the two groups where
    eligibility and income diverge on every measure."""
    lines = []
    for key in ["eq_ahc", "taxable"]:
        lines += [
            "",
            f"Eligibility by household decile of {DISTRIBUTION_LABELS[key]}:",
            "",
        ]
        lines.append(
            _table(
                d["distributions"][key]["deciles"],
                {
                    "decile": "Decile",
                    "households_m": "Households (m)",
                    "passported": "Passported share",
                    "income_only": "Income test only share",
                    "not_eligible": "Not eligible share",
                    "cost_share": "Share of cost",
                    "ess": "ESS",
                },
            )
        )
    lines += ["", "Where eligibility and income diverge (household deciles):", ""]
    for key, label in DISTRIBUTION_LABELS.items():
        low = d["distributions"][key]["low_not_eligible"]
        top = d["distributions"][key]["top_income_only"]
        passported = d["distributions"][key]["top_passported"]
        share = top["cost_share"] or 0
        lines.append(
            f"- {label}: not eligible in deciles 1-3 {low['households_m']:.2f}m "
            f"({100 * (low['share_of_base'] or 0):.0f}% of those deciles; ESS "
            f"{low['ess']:.0f}); eligible through the income test alone in deciles "
            f"6-10 {top['households_m']:.2f}m ({100 * (top['share_of_base'] or 0):.0f}% "
            f"of income-test-only households, {100 * share:.1f}% of cost; ESS "
            f"{top['ess']:.0f}); passported in deciles 6-10 "
            f"{passported['households_m']:.2f}m "
            f"({100 * (passported['share_of_base'] or 0):.0f}% of passported households, "
            f"{100 * (passported['cost_share'] or 0):.1f}% of cost; ESS "
            f"{passported['ess']:.0f})."
        )
    return lines


def markdown(results: dict, year: int) -> str:
    lines = [
        "# Targeted energy discount: results receipt",
        "",
        (
            f"Great Britain, FY{year}-{str(year + 1)[-2:]}. Generated by "
            "`uk-energy-reforms run`. Datasets:"
        ),
        "",
    ]
    seen = {d for by_dataset in results.values() for d in by_dataset}
    for key in sorted(seen):
        spec = DATASETS[key]
        lines.append(
            f"- `{key}`: {spec.label} ({spec.repo_id}@{spec.revision[:8]}, "
            f"sha256 {spec.sha256[:12]}…). {spec.notes}"
        )
    lines += ["", "## Headlines", ""]
    for name, by_dataset in results.items():
        base = name.split("_bill_share")[0].split("_budget")[0]
        lines.append(f"**{name}**: {DESCRIPTIONS.get(base, name)}.")
        for dataset, r in by_dataset.items():
            h = r["headline"]
            rel = next(
                p
                for p in r["poverty"]
                if p["measure"] == "rel_pov_ahc" and p["group"] == "people"
            )
            kids = next(
                p
                for p in r["poverty"]
                if p["measure"] == "rel_pov_ahc" and p["group"] == "children"
            )
            lines.append(
                f"- `{dataset}`: cost GBP {h['cost_bn']:.2f}bn; "
                f"{h['recipients_m']:.2f}m recipients ({100 * h['recipient_share']:.1f}% "
                f"of GB households), average GBP {h['average_per_recipient']:.0f}; "
                f"passported {100 * h['passported_share']:.1f}%, "
                f"income test {100 * h['income_test_share']:.1f}%; relative AHC "
                f"poverty {rel['change_k']:+,.0f}k people ({kids['change_k']:+,.0f}k "
                "children)."
            )
        lines.append("")
    for name, by_dataset in results.items():
        lines += [f"## {name}", ""]
        for dataset, r in by_dataset.items():
            lines += [f"### {dataset}", "", "By region:", ""]
            lines.append(
                _table(r["by_region"], {"region": "Region", **BREAKDOWN_COLUMNS})
            )
            lines += ["", "By household type:", ""]
            lines.append(
                _table(
                    r["by_household_type"],
                    {"household_type": "Household type", **BREAKDOWN_COLUMNS},
                )
            )
            lines += ["", "By AHC income decile (GB people):", ""]
            lines.append(
                _table(
                    r["deciles_ahc"],
                    {
                        "decile": "Decile",
                        "households_m": "Households (m)",
                        "share_receiving": "Share receiving",
                        "average_gain": "Avg gain (GBP)",
                        "gain_pct_net_income": "Gain, % net income",
                    },
                )
            )
            lines += ["", "Poverty (people unless stated):", ""]
            lines.append(
                _table(
                    r["poverty"],
                    {
                        "measure": "Measure",
                        "group": "Group",
                        "baseline_rate": "Baseline rate",
                        "reform_rate": "Reform rate",
                        "change_pp": "Change (pp)",
                        "change_k": "Change (k)",
                    },
                )
            )
            lines += [
                "",
                "Coverage of households in poverty or with high energy costs:",
                "",
            ]
            lines.append(
                _table(
                    r["coverage"],
                    {
                        "group": "Group",
                        "households_m": "Households (m)",
                        "covered_by_passport": "Covered by passport",
                        "covered": "Covered",
                        "missed_m": "Not reached (m)",
                    },
                )
            )
            if "income_distributions" in r:
                lines += _distribution_lines(r["income_distributions"])
            lines += ["", "Cliff edges (households on the schedule by own income):", ""]
            for c in r["cliffs"]:
                b = c["bands"]
                lines.append(
                    f"- GBP {c['threshold']:,.0f}: mean drop GBP {c['mean_drop']:.0f}; "
                    f"GBP 1k below {b['1000_below']['households_k']:.0f}k "
                    f"({b['1000_below']['bottom4_k']:.0f}k lowest-4); GBP 1k above "
                    f"{b['1000_above']['households_k']:.0f}k "
                    f"({b['1000_above']['bottom4_k']:.0f}k lowest-4, "
                    f"{b['1000_above']['rel_ahc_poverty_k']:.0f}k in rel. AHC poverty; "
                    f"ESS {b['1000_above']['ess']:.0f}); offset range "
                    f"{c['offset_range_k']:.0f}k (median width GBP "
                    f"{c['offset_range_median_width']:.0f})."
                )
            lines.append("")
    return "\n".join(lines)


def _format(value, unit):
    if value is None:
        return "n/a"
    if unit == "share":
        return f"{100 * value:.0f}%"
    if unit == "gbp":
        return f"£{value:,.0f}"
    if unit == "millions":
        return f"{value:.1f}m"
    if unit == "thousands":
        return f"{value:,.0f}k"
    return f"{value:,.2f}"


def rf_markdown(comparison: dict) -> str:
    """Markdown table of RF's figures beside ours, per dataset and year."""
    figures = comparison["figures"]
    columns = [
        (d, y) for d, by_year in figures[0]["policyengine"].items() for y in by_year
    ]
    head = "| Figure | RF (page) | " + " | ".join(f"{d} {y}" for d, y in columns) + " |"
    rule = "|" + "|".join(["---"] * (2 + len(columns))) + "|"
    body = [
        "| "
        + " | ".join(
            [
                f["label"],
                (
                    f"{_format(f['rf'], f['unit'])} (p. {f['page']})"
                    if f["rf"] is not None
                    else "not published"
                ),
                *[_format(f["policyengine"][d][y], f["unit"]) for d, y in columns],
            ]
        )
        + " |"
        for f in figures
    ]
    lines = ["# PolicyEngine estimates beside RF's figures", "", head, rule, *body, ""]
    lines += ["Notes:", ""] + [f"- {n}" for n in comparison["notes"]]
    lines += ["", "Not modelled:", ""] + [
        f"- {n['rf_statement']} (p. {n['page']}): {n['reason']}"
        for n in comparison["not_modelled"]
    ]
    return "\n".join(lines) + "\n"
