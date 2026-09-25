"""Compact, pre-computed results for the dashboard.

Reads an analysis folder (``results-2026/results.json``, ``results-2024/results.json``
and ``rf_comparison.json``) and writes one JSON file the dashboard imports at build
time. Only aggregate estimates leave this module; no microdata.
"""

from __future__ import annotations

import json
import math
from dataclasses import asdict
from datetime import UTC, datetime
from importlib.metadata import version
from pathlib import Path

from uk_energy_reforms.datasets import DATASETS
from uk_energy_reforms.reforms.targeted_energy_discount import DESCRIPTIONS
from uk_energy_reforms.sources import EXTERNAL_SOURCES

PRESET_LABELS = {
    "rf_flat": "Flat £175",
    "rf_tiered": "Tiered £220 / £85",
    "rf_tiered_own_income": "Tiered, passported by own income",
    "rf_household_income": "Household income test",
    "passport_only": "Passporting only",
}

VARIANT_LABELS = {
    "published": "RF's amounts",
    "budget_2bn": "Scaled to £2bn",
    "bill_share": "Bill share",
}

HEADLINE_KEYS = [
    "cost_bn",
    "recipients_m",
    "recipient_share",
    "average_per_recipient",
    "eligible_share",
    "passported_share",
    "income_test_share",
    "income_only_share",
    "cost_passported_bn",
    "cost_income_only_bn",
    "gb_households_m",
]

BREAKDOWN_KEYS = [
    "households_m",
    "ess",
    "eligible_rate",
    "passported_rate",
    "income_test_rate",
    "recipients_m",
    "cost_m",
    "cost_share",
    "average_per_recipient",
    "gain_pct_net_income",
    "mean_bill",
    "abs_ahc_poverty_rate",
    "abs_ahc_poverty_reached",
    "abs_ahc_poverty_not_reached_k",
    "rel_ahc_poverty_not_reached_k",
    "bottom4_not_reached_k",
    "people_out_of_rel_ahc_poverty_k",
    "people_out_of_abs_ahc_poverty_k",
]


# Eligibility across income measures (analysis.income_distributions): the keys the
# dashboard reads. Record counts stay out; effective sample sizes stay in.
DECILE_KEYS = [
    "decile",
    "households_m",
    "people_m",
    "ess",
    "passported",
    "income_only",
    "not_eligible",
    "average_gain",
    "cost_share",
]
CELL_KEYS = [
    "row",
    "col",
    "households_m",
    "household_share",
    "eligible",
    "passported",
    "income_only",
    "cost_share",
    "ess",
]
PROFILE_KEYS = [
    "households_m",
    "people_m",
    "children_m",
    "ess",
    "share_of_base",
    "cost_m",
    "cost_share",
    "rel_pov_bhc",
    "rel_pov_ahc",
    "mean_taxable",
    "mean_highest_income",
    "two_incomes_over_pa",
    "taxable_at_or_above_line",
    "by_household_type",
    "by_incomes",
]


def _round(value, sig: int = 4):
    """Round floats to ``sig`` significant figures (NaN to None), leaving ints alone.
    Used for the income-measure block only: schedules keep full precision."""
    if isinstance(value, dict):
        return {k: _round(v, sig) for k, v in value.items()}
    if isinstance(value, list):
        return [_round(v, sig) for v in value]
    if isinstance(value, float):
        if math.isnan(value):
            return None
        if value == 0:
            return 0.0
        return round(value, sig - 1 - math.floor(math.log10(abs(value))))
    return value


def _distributions(d: dict) -> dict:
    return _round(
        {
            "gb_households_m": d["gb_households_m"],
            "population": d["population"],
            "distributions": {
                key: {
                    "cut_points": m["cut_points"],
                    "negative_share": m["negative_share"],
                    "zero_share": m["zero_share"],
                    "deciles": [
                        {k: row[k] for k in DECILE_KEYS} for row in m["deciles"]
                    ],
                    "low_not_eligible": {
                        k: m["low_not_eligible"].get(k) for k in PROFILE_KEYS
                    },
                    "top_income_only": {
                        k: m["top_income_only"].get(k) for k in PROFILE_KEYS
                    },
                    "top_passported": {
                        k: m["top_passported"].get(k) for k in PROFILE_KEYS
                    },
                }
                for key, m in d["distributions"].items()
            },
            "crosstabs": {
                key: {
                    "row_cut_points": c["row_cut_points"],
                    "col_cut_points": c["col_cut_points"],
                    "cells": [{k: cell[k] for k in CELL_KEYS} for cell in c["cells"]],
                }
                for key, c in d["crosstabs"].items()
            },
        }
    )


def _split(key: str) -> tuple[str, str]:
    if key.endswith("_bill_share"):
        return key[: -len("_bill_share")], "bill_share"
    if "_budget_" in key:
        return key.split("_budget_")[0], "budget_2bn"
    return key, "published"


def _result(r: dict) -> dict:
    return {
        "headline": {k: r["headline"][k] for k in HEADLINE_KEYS},
        "by_bracket": r["headline"]["by_bracket"],
        "schedule": r["schedule"],
        "deciles": r["deciles_ahc"],
        "poverty": r["poverty"],
        "coverage": [
            {
                k: c[k]
                for k in [
                    "group",
                    "households_m",
                    "covered_by_passport",
                    "covered",
                    "missed_m",
                ]
            }
            for c in r["coverage"]
        ],
        "inequality": r["inequality"],
        "winners_losers": r["winners_losers"],
        "by_region": [
            {"group": row["region"], **{k: row[k] for k in BREAKDOWN_KEYS}}
            for row in r["by_region"]
        ],
        "by_household_type": [
            {"group": row["household_type"], **{k: row[k] for k in BREAKDOWN_KEYS}}
            for row in r["by_household_type"]
        ],
    }


YEAR_LABELS = {"2024": "2024-25", "2026": "2026-27", "2027": "2027-28"}


def _years(analysis_dir: Path) -> list[str]:
    """Scheme years with results, e.g. results-2026 and results-2027 (2024-25 is the
    replication year and is exported separately)."""
    return sorted(
        p.name.split("-")[1]
        for p in analysis_dir.glob("results-20*")
        if p.name != "results-2024" and (p / "results.json").exists()
    )


def build(analysis_dir: Path) -> dict:
    years = _years(analysis_dir)
    by_year = {
        y: json.loads((analysis_dir / f"results-{y}" / "results.json").read_text())
        for y in years
    }
    replication = json.loads(
        (analysis_dir / "results-2024" / "results.json").read_text()
    )
    comparison = json.loads((analysis_dir / "rf_comparison.json").read_text())

    scenarios = []
    for key in by_year[years[0]]:
        preset, variant = _split(key)
        scenarios.append(
            {
                "id": key,
                "preset": preset,
                "variant": variant,
                "label": f"{PRESET_LABELS.get(preset, preset)}, {VARIANT_LABELS[variant]}",
                "description": DESCRIPTIONS.get(preset, preset),
            }
        )
    results = {
        y: {
            key: {dataset: _result(r) for dataset, r in by_dataset.items()}
            for key, by_dataset in by_year[y].items()
        }
        for y in years
    }
    # The pre-reform picture, taken from the flat option's run (passporting and the
    # income test flags follow its rules).
    baseline = {
        y: {dataset: r["baseline"] for dataset, r in by_year[y]["rf_flat"].items()}
        for y in years
    }
    # Eligibility across income measures, for the published amounts of each preset
    # (eligibility does not depend on the amounts).
    distributions = {
        y: {
            key: {
                dataset: _distributions(r["income_distributions"])
                for dataset, r in by_dataset.items()
            }
            for key, by_dataset in by_year[y].items()
            if all("income_distributions" in r for r in by_dataset.values())
        }
        for y in years
    }
    datasets = sorted(
        {d for by_dataset in by_year[years[0]].values() for d in by_dataset}
    )
    return {
        "meta": {
            "generated": datetime.now(UTC).date().isoformat(),
            "years": years,
            "year_labels": {y: YEAR_LABELS.get(y, y) for y in years},
            "policyengine_uk": version("policyengine-uk"),
            "datasets": {
                d: {
                    "label": DATASETS[d].label,
                    "notes": DATASETS[d].notes,
                    "repo": DATASETS[d].repo_id,
                    "revision": DATASETS[d].revision,
                    "sha256": DATASETS[d].sha256,
                }
                for d in datasets
            },
            "presets": PRESET_LABELS,
            "variants": VARIANT_LABELS,
            "rf": {
                "title": "Billing me softly: how to design targeted energy discounts",
                "authors": "Mike Brewer, Alex Clegg and Jonathan Marshall",
                "publisher": "Resolution Foundation",
                "date": "2026-08-10",
                "url": "https://www.resolutionfoundation.org/publications/billing-me-softly/",
            },
        },
        "scenarios": scenarios,
        "results": results,
        "baseline": baseline,
        "distributions": distributions,
        "replication_2024": {
            key: {dataset: _result(r) for dataset, r in by_dataset.items()}
            for key, by_dataset in replication.items()
        },
        "rf_comparison": comparison,
        "external_sources": [asdict(source) for source in EXTERNAL_SOURCES],
    }


def write(analysis_dir: Path, out: Path, calculator_out: Path | None = None) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(build(analysis_dir), separators=(",", ":")))
    if calculator_out is not None:
        from uk_energy_reforms import calculator

        calculator.write(calculator_out)
