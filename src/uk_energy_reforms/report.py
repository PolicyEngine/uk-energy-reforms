"""Collect results for a set of scenarios and render them as JSON and a markdown receipt."""

from __future__ import annotations

import json
import math
from importlib.metadata import version
from pathlib import Path

import pandas as pd

from uk_energy_reforms import analysis, calibrate
from uk_energy_reforms.datasets import DATASETS
from uk_energy_reforms.reforms.targeted_energy_discount import DESCRIPTIONS, preset
from uk_energy_reforms.simulate import Run, run
from uk_energy_reforms.sources import EXTERNAL_SOURCES


def results_for(r: Run, distributions: bool = True) -> dict:
    """Every measure for one run, including its payment-specific income distributions.

    Eligibility is unchanged across payment bases; spending and gains are recomputed
    from each run's household outcomes, including zero bills in bill-share scenarios.
    """
    f = analysis.prepare(r)
    pov = analysis.poverty(r, f)
    out = {
        "dataset": r.dataset,
        "year": r.year,
        "policyengine_uk": version("policyengine-uk"),
        "take_up": r.take_up,
        "changes": r.changes,
        "schedule": r.schedule,
        "headline": analysis.headline(r, f),
        "baseline": analysis.baseline_summary(r, f),
        "inequality": analysis.inequality(r, f),
        "winners_losers": analysis.winners_losers(r, f),
        "deciles_ahc": analysis.deciles(r, f, "ahc"),
        "poverty": pov,
        "take_up_sensitivity": analysis.take_up_sensitivity(r, f, pov),
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
            if value is None or (isinstance(value, float) and math.isnan(value)):
                cells.append("–")  # blanked: fewer than 10 survey records
            elif isinstance(value, str):
                cells.append(value)
            elif any(s in column for s in ("rate", "share", "covered", "pct")):
                cells.append(f"{100 * value:.1f}%")
            elif column in ("sample_n", "decile", "moved_records"):
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
    "abs_bhc_poverty_reached": "In abs. BHC poverty, reached",
    "abs_bhc_poverty_not_reached_k": "In abs. BHC poverty, not reached (k)",
    "people_out_of_abs_bhc_poverty_k": "People out of abs. BHC poverty (k)",
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
        lines.append(
            f"- {label}: not eligible in deciles 1-3 "
            f"{_group(low, 'of those deciles')}; eligible through the income test "
            f"alone in deciles 6-10 "
            f"{_group(top, 'of income-test-only households', cost=True)}; passported "
            f"in deciles 6-10 {_group(passported, 'of passported households', cost=True)}."
        )
    lines += [
        "",
        "The same lowest-three-decile group with deciles of people (HBAI):",
        "",
    ]
    for key, check in d.get("person_deciles", {}).items():
        people = check["people_share"]
        lines.append(
            f"- {DISTRIBUTION_LABELS[key]}: not eligible "
            f"{_group(check, 'of households in those deciles')}"
            + (f", {100 * people:.0f}% of the people in them." if people else ".")
        )
    return lines


def _signed_k(value, unit: str = "k") -> str:
    """A signed count in thousands, or a dash where it is blanked (fewer than 10 survey
    records cross the line)."""
    return "–" if value is None else f"{value:+,.0f}{unit}"


def _group(g: dict, base: str, cost: bool = False) -> str:
    """One divergence group for the receipt; groups resting on too few records say so."""
    if g.get("suppressed"):
        return f"(fewer than {analysis.MIN_RECORDS} records; not shown)"
    if not g.get("households_m"):
        return "none"
    text = f"{g['households_m']:.2f}m ({100 * (g['share_of_base'] or 0):.0f}% {base}"
    if cost:
        text += f", {100 * (g['cost_share'] or 0):.1f}% of cost"
    return text + f"; ESS {g['ess']:.0f})"


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
    engines = sorted(
        {r.get("policyengine_uk") for d in results.values() for r in d.values()}
        - {None}
    )
    lines += [
        "",
        (
            f"Model: policyengine-uk {', '.join(engines) or 'version not recorded'}. "
            "Absolute poverty uses the line HBAI has used since March 2026: 60% of the "
            "2024-25 median, held constant in real terms. Relative poverty uses 60% of "
            "the baseline UK median, held fixed for the reform."
        ),
        "",
        (
            "A dash marks a poverty change resting on fewer than 10 survey records "
            "crossing the line. A blanked change is still included in the totals "
            "shown: the change for all people, and the national figures for regions "
            "and household types."
        ),
    ]
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
                f"poverty {_signed_k(rel['change_k'])} people "
                f"({_signed_k(kids['change_k'])} children)."
            )
        lines.append("")
    lines += _hbai_lines(results, year)
    lines += _caseload_lines(results)
    lines += _gas_lines(results, year)
    lines += _take_up_lines(results)
    lines += _cut_off_lines(results)
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
                    [
                        {**p, "moved_records": "<10"} if p.get("suppressed") else p
                        for p in r["poverty"]
                    ],
                    {
                        "measure": "Measure",
                        "group": "Group",
                        "baseline_rate": "Baseline rate",
                        "reform_rate": "Reform rate",
                        "change_pp": "Change (pp)",
                        "change_k": "Change (k)",
                        "moved_records": "Records crossing",
                        "moved_ess": "ESS crossing",
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
            lines.append("")
    return "\n".join(lines)


# HBAI's published rates for the same groups (external_sources.json). In 2024-25, the
# reference year of the absolute line, absolute and relative rates coincide.
HBAI_RATES = {
    "people": "hbai_individuals_low_income_rates_fye2025",
    "children": "hbai_children_low_income_rates_fye2025",
    "pensioners": "hbai_pensioners_low_income_rates_fye2025",
}
HBAI_MEASURES = {
    "abs_pov_bhc": "absolute_bhc",
    "abs_pov_ahc": "absolute_ahc",
    "rel_pov_bhc": "relative_bhc",
    "rel_pov_ahc": "relative_ahc",
}


def _hbai_lines(results: dict, year: int) -> list:
    """Baseline poverty rates beside HBAI's. The baseline does not depend on the
    option, so the first one's is used."""
    sources = {s.id: s for s in EXTERNAL_SOURCES}
    first = next(iter(results.values()))
    datasets = list(first)
    lines = [
        "## Baseline poverty against HBAI",
        "",
        (
            f"Model rates are for Great Britain in FY{year}-{str(year + 1)[-2:]}, before "
            "the reform. HBAI's are for the UK in 2024-25, the latest year it covers. The "
            "model's relative line is 60% of the median in its own data. The numbers of "
            "people moved across a line depend on how many sit near it, so they inherit "
            "these differences."
        ),
        "",
        "| Measure | Group | " + " | ".join(f"`{d}`" for d in datasets) + " | HBAI |",
        "|---|---|" + "---|" * (len(datasets) + 1),
    ]
    for measure, key in HBAI_MEASURES.items():
        for group, source in HBAI_RATES.items():
            model = [
                next(
                    p["baseline_rate"]
                    for p in first[d]["baseline"]["poverty_rates"]
                    if p["measure"] == measure and p["group"] == group
                )
                for d in datasets
            ]
            hbai = sources[source].value[key]
            lines.append(
                f"| {measure} | {group} | "
                + " | ".join(f"{100 * m:.1f}%" for m in model)
                + f" | {100 * hbai:.1f}% |"
            )
    return [*lines, ""]


def _caseload_lines(results: dict) -> list:
    """Passported households beside DWP's two largest passporting caseloads. The
    caseloads overlap (a household can hold both) and count benefit units, so they
    bound the passported count loosely rather than match it."""
    sources = {s.id: s for s in EXTERNAL_SOURCES}
    uc = sources["dwp_uc_households_may2026"]
    pc = sources["dwp_pension_credit_mar2026"]
    first = next(iter(results.values()))
    lines = ["## Passporting against benefit caseloads", ""]
    for dataset, r in first.items():
        h = r["headline"]
        lines.append(
            f"- `{dataset}`: {h['passported_share'] * h['gb_households_m']:.2f}m "
            f"passported households ({100 * h['passported_share']:.1f}% of GB)."
        )
    lines += [
        (
            f"- DWP: {uc.value['households_on_uc'] / 1e6:.1f}m benefit units on "
            f"Universal Credit, {uc.value['households_with_payment'] / 1e6:.1f}m of "
            f"them with a payment ({uc.geography}, "
            f"{uc.period.replace(' (', ', ').rstrip(')')}); "
            f"{pc.value['claimants'] / 1e6:.2f}m Pension Credit claimants "
            f"({pc.geography}, {pc.period})."
        ),
        (
            "- The caseloads count benefit units and overlap where one household "
            "holds both, so they bound the passported count loosely; Housing Benefit "
            "and the legacy benefits add a little more."
        ),
        "",
    ]
    return lines


def _gas_lines(results: dict, year: int) -> list:
    """Gas spend beside DESNZ's average bill at actual consumption (Quarterly Energy
    Prices table 2.3.5): per household with gas spend, and in total. Each dataset keeps
    spend at its stored price level in every year."""
    v = {s.id: s for s in EXTERNAL_SOURCES}["qep_gas_bills_actual_consumption_gb"].value
    bill = v["bill_actual_2024"]
    on_gas = v["on_gas_households_2024"] / v["gb_households_2024"]
    total = bill * v["on_gas_households_2024"] / 1e9
    lines = [
        "## Gas spend against DESNZ",
        "",
        (
            "DESNZ's average domestic gas bill at actual consumption was GBP "
            f"{bill:,.0f} per on-gas household in 2024 (GBP "
            f"{v['bill_temperature_adjusted_2024']:,.0f} at temperature-adjusted "
            f"consumption; GBP {v['bill_actual_2025']:,.0f} in 2025), with "
            f"{100 * on_gas:.0f}% of GB households on gas: GBP {total:.1f}bn in total "
            "(Quarterly Energy Prices table 2.3.5). That share is DESNZ's estimate of "
            "on-gas households over GB households. The 84% quoted elsewhere is a "
            "different basis: gas meters over all domestic properties, which include "
            "empty and second homes (sub-national consumption statistics). The "
            "reconciliation uses the household basis, as the bills do. Model figures "
            "are for "
            f"FY{year}-{str(year + 1)[-2:]} households at each dataset's stored price "
            "level: 2024-25 for Microcosm, April-June 2026 unit rates for the Enhanced "
            "FRS."
        ),
        "",
        (
            "| Dataset | Households with gas spend | Gas spend per such household "
            "(GBP) | Against DESNZ | Total gas spend (GBP bn) | Against DESNZ |"
        ),
        "|---|---|---|---|---|---|",
    ]
    for dataset, r in next(iter(results.values())).items():
        b = r["baseline"]
        share = b["gas_spend_share"]
        per = b["mean_gas"] / share if share else float("nan")
        spend = b["mean_gas"] * b["households_m"] / 1e3
        lines.append(
            f"| `{dataset}` | {100 * share:.1f}% | {per:,.0f} | "
            f"{100 * (per / bill - 1):+.0f}% | {spend:.1f} | "
            f"{100 * (spend / total - 1):+.0f}% |"
        )
    return [*lines, ""]


def _take_up_lines(results: dict) -> list:
    """Each option at RF's amounts with lower take-up among households eligible
    through the income test alone (passported households are enrolled automatically)."""
    lines = [
        "## Take-up sensitivity",
        "",
        (
            "Every figure elsewhere assumes that every eligible household receives the "
            "discount. Here households eligible through the income test alone take it "
            "up at the given rate; passported households are enrolled automatically. "
            "Expected values from the full take-up run "
            "(`analysis.take_up_sensitivity`). Poverty columns are the change in people."
        ),
        "",
        (
            "| Option | Dataset | Take-up | Cost (GBP bn) | Recipients (m) "
            "| Abs. BHC poverty (k) | Rel. AHC poverty (k) |"
        ),
        "|---|---|---|---|---|---|---|",
    ]
    for name, by_dataset in results.items():
        if name != name.split("_bill_share")[0].split("_budget")[0]:
            continue
        for dataset, r in by_dataset.items():
            if not r["schedule"].get("income_test") or not r.get("take_up_sensitivity"):
                continue
            people = {p["measure"]: p for p in r["poverty"] if p["group"] == "people"}
            h = r["headline"]
            rows = [
                (
                    r["take_up"],
                    h["cost_bn"],
                    h["recipients_m"],
                    people["abs_pov_bhc"]["change_k"],
                    people["rel_pov_ahc"]["change_k"],
                )
            ] + [
                (
                    t["take_up"],
                    t["cost_bn"],
                    t["recipients_m"],
                    t["abs_pov_bhc_change_k"],
                    t["rel_pov_ahc_change_k"],
                )
                for t in r["take_up_sensitivity"]
            ]
            for rate, cost, recipients, absolute, relative in rows:
                lines.append(
                    f"| {name} | `{dataset}` | {100 * rate:.0f}% | {cost:.2f} | "
                    f"{recipients:.2f} | {_signed_k(absolute, '')} | "
                    f"{_signed_k(relative, '')} |"
                )
    return [*lines, ""]


def _cut_off_lines(results: dict) -> list:
    """Every option's counts around its income cut-offs, under one heading the
    dashboard links to (``#income-cut-offs``)."""
    lines = [
        "## Income cut-offs",
        "",
        (
            "Households near each income threshold where support falls, counting only "
            "households placed on the schedule by their own income. The offset range "
            "holds households above a threshold whose extra income, after tax, is "
            "smaller than the support they lose there. Options without an income test "
            "have no cut-offs. By region, each option's tables below give the count "
            "within GBP 1k above the top threshold and the offset range."
        ),
        "",
    ]
    for name, by_dataset in results.items():
        if not any(r["cliffs"] for r in by_dataset.values()):
            continue
        lines += [f"**{name}**:", ""]
        for dataset, r in by_dataset.items():
            for c in r["cliffs"]:
                b = c["bands"]
                lines.append(
                    f"- `{dataset}`, GBP {c['threshold']:,.0f}: mean drop GBP "
                    f"{c['mean_drop']:.0f}; GBP 1k below "
                    f"{b['1000_below']['households_k']:.0f}k "
                    f"({b['1000_below']['bottom4_k']:.0f}k lowest-4); GBP 1k above "
                    f"{b['1000_above']['households_k']:.0f}k "
                    f"({b['1000_above']['bottom4_k']:.0f}k lowest-4, "
                    f"{b['1000_above']['rel_ahc_poverty_k']:.0f}k in rel. AHC poverty; "
                    f"ESS {b['1000_above']['ess']:.0f}); offset range "
                    f"{c['offset_range_k']:.0f}k (median width GBP "
                    f"{c['offset_range_median_width']:.0f})."
                )
        lines.append("")
    return lines


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
    lines += ["Notes:", ""] + [
        f"- {n}" for n in comparison["notes"] + comparison.get("receipt_notes", [])
    ]
    lines += ["", "Not modelled:", ""] + [
        f"- {n['rf_statement']} (p. {n['page']}): {n['reason']}"
        for n in comparison["not_modelled"]
    ]
    return "\n".join(lines) + "\n"
