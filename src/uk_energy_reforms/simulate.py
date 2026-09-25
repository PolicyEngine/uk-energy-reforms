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


def household_incomes(person: pd.DataFrame) -> pd.DataFrame:
    """Per household: taxable income summed over members (the income test's concept
    applied to the whole household), the number of members with taxable income above
    zero, and the second-highest member's taxable income (0 with fewer than two members).
    """
    ranked = person.sort_values("total_income", ascending=False, kind="stable")
    rank = ranked.groupby("household_id").cumcount()
    g = person.groupby("household_id").total_income
    return pd.DataFrame(
        {
            "taxable_income": g.sum(),
            "n_incomes": (person.total_income > 0).groupby(person.household_id).sum(),
            "second_income": ranked[rank == 1]
            .set_index("household_id")
            .total_income.reindex(g.sum().index)
            .fillna(0.0),
        }
    )


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
            "equivalisation_bhc": _values(sim, "household_equivalisation_bhc", year),
            "equivalisation_ahc": _values(sim, "household_equivalisation_ahc", year),
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
        }
    )
    # Whether the highest-income member is over State Pension age (pays no employee
    # NI), which sets the marginal rate used for dead zones.
    top = person.sort_values("total_income", ascending=False, kind="stable")
    counts["top_earner_pensioner"] = top.groupby("household_id").sp_age.first()
    counts["household_type"] = classify(person)
    counts = counts.join(household_incomes(person))
    frame = frame.merge(counts, left_on="household_id", right_index=True, how="left")
    frame["gb"] = frame.region != "NORTHERN_IRELAND"
    return frame


@lru_cache(maxsize=8)
def benunit_frame(dataset: str, year: int) -> pd.DataFrame:
    """Benefit units with their household, weight and family type (for RF's counts).

    RF counts benefit units in its family-type figures: couples with children (two
    working-age adults and at least one child) and pensioner units (an adult over State
    Pension age), wherever they live, including multi-family households.
    """
    sim = Microsimulation(dataset=str(dataset_path(dataset)))
    person = pd.DataFrame(
        {
            "benunit_id": _values(sim, "benunit_id", year, map_to="person"),
            "household_id": _values(sim, "household_id", year, map_to="person"),
            "is_child": _values(sim, "is_child", year).astype(bool),
            "sp_age": _values(sim, "is_SP_age", year).astype(bool),
        }
    )
    person["sp_adult"] = person.sp_age & ~person.is_child
    g = person.groupby("benunit_id")
    units = pd.DataFrame(
        {
            "household_id": g.household_id.first(),
            "adults": g.is_child.apply(lambda s: int((~s).sum())),
            "children": g.is_child.sum(),
            "pensioner": g.sp_adult.any(),
        }
    )
    weights = pd.Series(
        _values(sim, "benunit_weight", year), index=_values(sim, "benunit_id", year)
    )
    units["weight"] = weights.reindex(units.index).values
    units["couple_with_children"] = (
        (units.adults == 2) & (units.children > 0) & ~units.pensioner
    )
    return units.reset_index()


def resolved_schedule(sim, year: int) -> dict:
    p = sim.tax_benefit_system.parameters.gov.contrib.targeted_energy_discount(
        f"{year}-01-01"
    )
    return {
        "in_effect": bool(p.in_effect),
        "bill_share": bool(p.bill_share.in_effect),
        "thresholds": [float(t) for t in p.amount.thresholds],
        "amounts": [float(a) for a in p.amount.amounts],
        "rate_thresholds": [float(t) for t in p.bill_share.rate.thresholds],
        "rates": [float(r) for r in p.bill_share.rate.amounts],
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
