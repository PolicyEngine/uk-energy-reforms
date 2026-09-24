"""Compact, pre-computed results for the dashboard.

Reads an analysis folder (``results-2026/results.json``, ``results-2024/results.json``
and ``rf_comparison.json``) and writes one JSON file the dashboard imports at build
time. Only aggregate estimates leave this module; no microdata.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from importlib.metadata import version
from pathlib import Path

from uk_energy_reforms.datasets import DATASETS
from uk_energy_reforms.reforms.targeted_energy_discount import DESCRIPTIONS

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
    "abs_ahc_poor_covered",
    "abs_ahc_poor_missed_k",
    "rel_ahc_poor_missed_k",
    "bottom4_missed_k",
    "people_out_of_rel_ahc_poverty_k",
    "people_out_of_abs_ahc_poverty_k",
    "just_above_top_threshold_k",
    "just_above_bottom4_k",
    "dead_zone_k",
]


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
        "cliffs": r["cliffs"],
        "by_region": [
            {"group": row["region"], **{k: row[k] for k in BREAKDOWN_KEYS}}
            for row in r["by_region"]
        ],
        "by_household_type": [
            {"group": row["household_type"], **{k: row[k] for k in BREAKDOWN_KEYS}}
            for row in r["by_household_type"]
        ],
    }


def build(analysis_dir: Path) -> dict:
    results = json.loads((analysis_dir / "results-2026" / "results.json").read_text())
    replication = json.loads(
        (analysis_dir / "results-2024" / "results.json").read_text()
    )
    comparison = json.loads((analysis_dir / "rf_comparison.json").read_text())

    scenarios, data = [], {}
    for key, by_dataset in results.items():
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
        data[key] = {dataset: _result(r) for dataset, r in by_dataset.items()}

    datasets = sorted({d for by_dataset in results.values() for d in by_dataset})
    return {
        "meta": {
            "generated": datetime.now(UTC).date().isoformat(),
            "year": "2026-27",
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
        "results": data,
        "replication_2024": {
            key: {dataset: _result(r) for dataset, r in by_dataset.items()}
            for key, by_dataset in replication.items()
        },
        "rf_comparison": comparison,
    }


def write(analysis_dir: Path, out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(build(analysis_dir), separators=(",", ":")))
