"""Run the baseline and a targeted-energy-discount reform on a dataset.

Returns one household frame per run, with baseline and reform outcomes side by side,
so every analysis (impacts, eligibility, cliff edges, breakdowns) reads one table.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache

import numpy as np
import pandas as pd
from policyengine_uk import Microsimulation

from uk_energy_reforms.datasets import dataset_path
from uk_energy_reforms.household_types import classify
from uk_energy_reforms.reforms.targeted_energy_discount import scenario

OUTCOMES = {
    "hbai_household_net_income": "net_bhc",
    "hbai_household_net_income_ahc": "net_ahc",
    "equiv_hbai_household_net_income": "eq_bhc",
    "equiv_hbai_household_net_income_ahc": "eq_ahc",
    "household_net_income": "hni",
    "in_poverty_bhc": "abs_pov_bhc",
    "in_poverty_ahc": "abs_pov_ahc",
}

DISCOUNT = {
    "targeted_energy_discount": "discount",
    "targeted_energy_discount_eligible": "eligible",
    "targeted_energy_discount_passported": "passported",
    "targeted_energy_discount_income_route": "income_route",
    "targeted_energy_discount_highest_income": "highest_income",
    "targeted_energy_discount_tested_income": "tested_income",
    "targeted_energy_discount_assessed_income": "assessed_income",
    "targeted_energy_discount_bill": "bill",
    "claims_targeted_energy_discount": "claims",
}


@dataclass
class Run:
    dataset: str
    year: int
    changes: dict
    frame: pd.DataFrame
    schedule: dict = field(default_factory=dict)
    take_up: float = 1.0


def _values(sim, variable, year, map_to=None):
    return np.asarray(sim.calculate(variable, year, map_to=map_to).values)


@lru_cache(maxsize=8)
def baseline_frame(dataset: str, year: int) -> pd.DataFrame:
    """Household frame of baseline outcomes and demographics (cached per dataset-year)."""
    sim = Microsimulation(dataset=str(dataset_path(dataset)))
    frame = pd.DataFrame(
        {
            "household_id": _values(sim, "household_id", year),
            "weight": _values(sim, "household_weight", year),
            "region": _values(sim, "region", year).astype(str),
            "tenure": _values(sim, "tenure_type", year).astype(str),
            "elec": _values(sim, "electricity_consumption", year),
            "gas": _values(sim, "gas_consumption", year),
        }
    )
    for variable, column in OUTCOMES.items():
        frame[f"{column}_base"] = _values(sim, variable, year)

    person = pd.DataFrame(
        {
            "household_id": _values(sim, "household_id", year, map_to="person"),
            "benunit_id": _values(sim, "benunit_id", year, map_to="person"),
            "is_child": _values(sim, "is_child", year).astype(bool),
            "sp_age": _values(sim, "is_SP_age", year).astype(bool),
            "total_income": _values(sim, "total_income", year),
        }
    )
    g = person.groupby("household_id")
    counts = pd.DataFrame(
        {
            "n_people": g.size(),
            "n_children": g.is_child.sum(),
            "n_sp_age": g.sp_age.sum(),
            "n_wa_adults": g.apply(
                lambda d: int((~d.is_child & ~d.sp_age).sum()), include_groups=False
            ),
            "second_income": g.total_income.apply(
                lambda s: np.sort(s.values)[-2] if len(s) > 1 else 0.0
            ),
        }
    )
    counts["household_type"] = classify(person)
    frame = frame.merge(counts, left_on="household_id", right_index=True, how="left")
    frame["gb"] = frame.region != "NORTHERN_IRELAND"
    return frame


def resolved_schedule(sim, year: int) -> dict:
    p = sim.tax_benefit_system.parameters.gov.contrib.targeted_energy_discount(
        f"{year}-01-01"
    )
    return {
        "in_effect": bool(p.in_effect),
        "unit_rate": bool(p.unit_rate.in_effect),
        "thresholds": [float(t) for t in p.amount.thresholds],
        "amounts": [float(a) for a in p.amount.amounts],
        "rate_thresholds": [float(t) for t in p.unit_rate.rate.thresholds],
        "rates": [float(r) for r in p.unit_rate.rate.amounts],
        "passport_assessed_income": float(p.passport.assessed_income),
        "income_test": bool(p.income_test.in_effect),
        "household_equivalised": bool(p.income_test.household_equivalised),
        "count_in_hbai_income": bool(p.count_in_hbai_income),
    }


def run(
    dataset: str,
    year: int,
    changes: dict | None = None,
    take_up: float = 1.0,
    seed: int = 0,
) -> Run:
    """Simulate a reform and return baseline and reform outcomes per household.

    ``take_up`` applies to households eligible only through the income test (they
    must self-declare); passported households are enrolled automatically. Draws are
    seeded and made before the simulation computes anything.
    """
    base = baseline_frame(dataset, year)
    sim = Microsimulation(
        scenario=scenario(changes), dataset=str(dataset_path(dataset))
    )
    if take_up < 1:
        ids = _values(sim, "household_id", year)
        draws = np.random.default_rng(seed).random(len(ids))
        order = np.argsort(ids, kind="stable")
        claims = np.empty(len(ids), dtype=bool)
        claims[order] = draws < take_up
        sim.set_input("claims_targeted_energy_discount", year, claims)
    frame = base.copy()
    ids = _values(sim, "household_id", year)
    if not np.array_equal(ids, frame.household_id.values):
        raise ValueError("Baseline and reform household order differ")
    for variable, column in OUTCOMES.items():
        frame[f"{column}_reform"] = _values(sim, variable, year)
    for variable, column in DISCOUNT.items():
        frame[column] = _values(sim, variable, year)
    return Run(
        dataset=dataset,
        year=year,
        changes=dict(changes or {}),
        frame=frame,
        schedule=resolved_schedule(sim, year),
        take_up=take_up,
    )
