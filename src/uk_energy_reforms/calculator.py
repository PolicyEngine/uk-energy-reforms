"""Reference cases for the dashboard's household calculator.

The dashboard computes a household's discount in the browser from the scheme rules
(`targeted_energy_discount` in policyengine-uk). This module exports the parameters that
calculation needs and a set of households whose discount policyengine-uk itself computes,
so the dashboard's tests can check the browser calculation against the model.
"""

from __future__ import annotations

import json
from pathlib import Path

from policyengine_uk import CountryTaxBenefitSystem, Simulation

from uk_energy_reforms.reforms.targeted_energy_discount import preset, scenario
from uk_energy_reforms.reforms.targeted_energy_discount.presets import P

YEAR = 2026
PRESETS = [
    "rf_flat",
    "rf_tiered",
    "rf_tiered_own_income",
    "rf_household_income",
    "passport_only",
]
BILL_SHARE_RATES = [0.15, 0.06, 0.0]

# Each case: adults' taxable incomes and ages, children under and over 14, whether the
# household receives a passporting benefit, region and annual gas and electricity bill.
# Adults beyond two form a second benefit unit (for example an adult child).
CASES = [
    {"id": "single_17k", "adults": [(17_000, 40)]},
    {"id": "single_20k", "adults": [(20_000, 40)]},
    {"id": "single_24k", "adults": [(24_000, 40)]},
    {"id": "couple_23k_23k", "adults": [(23_000, 40), (23_000, 38)]},
    {
        "id": "one_earner_29k_two_young_children",
        "adults": [(29_000, 40), (0, 38)],
        "young_children": 2,
    },
    {
        "id": "one_earner_29k_older_child_passported",
        "adults": [(29_000, 40), (0, 38)],
        "older_children": 1,
        "passported": True,
    },
    {"id": "pensioner_15k", "adults": [(15_000, 70)]},
    {"id": "pensioner_couple_22k_20k", "adults": [(22_000, 72), (20_000, 70)]},
    {"id": "passported_30k", "adults": [(30_000, 40)], "passported": True},
    {"id": "passported_10k", "adults": [(10_000, 40)], "passported": True},
    {
        "id": "multi_family_parent_and_adult_child",
        "adults": [(16_000, 70), (0, 68), (26_000, 30)],
    },
    {
        "id": "northern_ireland_17k",
        "adults": [(17_000, 40)],
        "region": "NORTHERN_IRELAND",
    },
    {"id": "single_19k_high_bill", "adults": [(19_000, 40)], "bill": 3_200},
]


def _situation(case: dict) -> dict:
    people, units = {}, [[], []]
    for i, (income, age) in enumerate(case["adults"]):
        name = f"adult{i}"
        income_var = "private_pension_income" if age >= 66 else "employment_income"
        people[name] = {"age": {YEAR: age}, income_var: {YEAR: income}}
        units[0 if i < 2 else 1].append(name)
    for i in range(case.get("young_children", 0)):
        people[f"young{i}"] = {"age": {YEAR: 6}}
        units[0].append(f"young{i}")
    for i in range(case.get("older_children", 0)):
        people[f"older{i}"] = {"age": {YEAR: 15}}
        units[0].append(f"older{i}")
    uc = 1_000 if case.get("passported") else 0
    benunits = {
        f"b{j}": {"members": members, "universal_credit": {YEAR: uc if j == 0 else 0}}
        for j, members in enumerate(units)
        if members
    }
    bill = case.get("bill", 1_500)
    return {
        "people": people,
        "benunits": benunits,
        "households": {
            "h": {
                "members": list(people),
                "region": {YEAR: case.get("region", "NORTH_WEST")},
                "electricity_consumption": {YEAR: bill * 0.6},
                "gas_consumption": {YEAR: bill * 0.4},
            }
        },
    }


def _outcome(situation: dict, changes: dict) -> dict:
    """The model's discount and the route it took, for the dashboard's sentence."""
    sim = Simulation(situation=situation, scenario=scenario(changes))

    def value(name):
        return sim.calculate(name, YEAR)[0]

    return {
        "amount": float(value("targeted_energy_discount")),
        "eligible": bool(value("targeted_energy_discount_eligible")),
        "income_route": bool(value("targeted_energy_discount_income_route")),
        "tested_income": float(value("targeted_energy_discount_tested_income")),
    }


def _passported(situation: dict) -> bool:
    """Whether the model passports the household. This can differ from the case's
    input flag: a low-income pensioner is passported through modelled Pension Credit."""
    sim = Simulation(situation=situation, scenario=scenario(preset("rf_flat")))
    return bool(sim.calculate("targeted_energy_discount_passported", YEAR)[0])


def _bill_share(name: str) -> dict:
    changes = {**preset(name), f"{P}.bill_share.in_effect": True}
    for i, rate in enumerate(BILL_SHARE_RATES):
        changes[f"{P}.bill_share.rate[{i}].amount"] = rate
    return changes


def equivalisation_scale() -> dict:
    """The BHC equivalisation factors RF's household-income option divides by."""
    p = CountryTaxBenefitSystem().parameters.household.demographic.equiv.bhc
    at = f"{YEAR}-01-01"
    return {
        "first_adult": float(p.first_adult(at)),
        "other_adult": float(p.second_adult(at)),
        "child_14_plus": float(p.child_over_14(at)),
        "child_under_14": float(p.child_under_14(at)),
    }


def build() -> dict:
    cases = []
    for case in CASES:
        situation = _situation(case)
        outcomes = {name: _outcome(situation, preset(name)) for name in PRESETS}
        outcomes["rf_tiered_bill_share"] = _outcome(situation, _bill_share("rf_tiered"))
        expected = {name: o["amount"] for name, o in outcomes.items()}
        routes = {
            name: {k: o[k] for k in ("eligible", "income_route", "tested_income")}
            for name, o in outcomes.items()
        }
        cases.append(
            {
                "id": case["id"],
                "adult_incomes": [income for income, _ in case["adults"]],
                "young_children": case.get("young_children", 0),
                "older_children": case.get("older_children", 0),
                "passported": _passported(situation),
                "region": case.get("region", "NORTH_WEST"),
                "bill": case.get("bill", 1_500),
                "expected": expected,
                "routes": routes,
            }
        )
    return {
        "year": YEAR,
        "equivalisation": equivalisation_scale(),
        "bill_share_rates": BILL_SHARE_RATES,
        "cases": cases,
    }


def write(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(build(), indent=1))
