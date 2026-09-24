"""Household-level tests of the targeted energy discount (no microdata needed).

Expected amounts come from RF, "Billing me softly" (10 August 2026), p. 9: 175 GBP flat
below 24,000 GBP; tiered 220 GBP below 18,000 GBP and 85 GBP from 18,000 GBP to
24,000 GBP; eligibility by passporting benefit or highest individual taxable income.
"""

import pytest
from policyengine_uk import Simulation

from uk_energy_reforms.reforms.targeted_energy_discount import preset, scenario
from uk_energy_reforms.reforms.targeted_energy_discount.presets import P

YEAR = 2026


def household(people, region="NORTH_WEST", electricity=800, gas=700, benunit=None):
    """``people`` is a list of dicts of person inputs for YEAR."""
    persons = {
        f"p{i}": {k: {YEAR: v} for k, v in {"age": 40, **p}.items()}
        for i, p in enumerate(people)
    }
    names = list(persons)
    return {
        "people": persons,
        "benunits": {
            "b": {
                "members": names,
                **{k: {YEAR: v} for k, v in (benunit or {}).items()},
            }
        },
        "households": {
            "h": {
                "members": names,
                "region": {YEAR: region},
                "electricity_consumption": {YEAR: electricity},
                "gas_consumption": {YEAR: gas},
            }
        },
    }


def calc(situation, changes, variable="targeted_energy_discount"):
    sim = Simulation(situation=situation, scenario=scenario(changes))
    return float(sim.calculate(variable, YEAR)[0])


def earner(amount):
    return {"employment_income": amount}


@pytest.mark.parametrize(
    "incomes, flat, tiered",
    [
        ([17_000], 175, 220),
        ([20_000], 175, 85),
        ([23_999], 175, 85),
        ([24_000], 0, 0),  # the test is strictly below 24,000 GBP
        ([30_000], 0, 0),
        ([23_000, 23_000], 175, 85),  # two earners each below the line qualify
        ([30_000, 0], 0, 0),  # a single earner above the line does not
    ],
)
def test_income_test_schedule(incomes, flat, tiered):
    situation = household([earner(i) for i in incomes])
    assert calc(situation, preset("rf_flat")) == pytest.approx(flat)
    assert calc(situation, preset("rf_tiered")) == pytest.approx(tiered)


def test_default_parameters_leave_the_baseline_unchanged():
    situation = household([earner(17_000)])
    reformed = Simulation(situation=situation, scenario=scenario())
    baseline = Simulation(situation=situation)
    assert float(reformed.calculate("targeted_energy_discount", YEAR)[0]) == 0
    for variable in [
        "hbai_household_net_income",
        "household_net_income",
        "gov_spending",
    ]:
        assert float(reformed.calculate(variable, YEAR)[0]) == pytest.approx(
            float(baseline.calculate(variable, YEAR)[0])
        )


def test_discount_enters_net_income_and_spending():
    situation = household([earner(17_000)])
    reformed = Simulation(situation=situation, scenario=scenario(preset("rf_flat")))
    baseline = Simulation(situation=situation)
    for variable in [
        "hbai_household_net_income",
        "household_net_income",
        "gov_spending",
    ]:
        delta = float(reformed.calculate(variable, YEAR)[0]) - float(
            baseline.calculate(variable, YEAR)[0]
        )
        assert delta == pytest.approx(175)


def test_price_reduction_treatment_leaves_hbai_income_unchanged():
    situation = household([earner(17_000)])
    changes = {**preset("rf_flat"), f"{P}.count_in_hbai_income": False}
    reformed = Simulation(situation=situation, scenario=scenario(changes))
    baseline = Simulation(situation=situation)
    hbai = float(reformed.calculate("hbai_household_net_income", YEAR)[0])
    assert hbai == pytest.approx(
        float(baseline.calculate("hbai_household_net_income", YEAR)[0])
    )
    assert float(reformed.calculate("household_net_income", YEAR)[0]) == pytest.approx(
        float(baseline.calculate("household_net_income", YEAR)[0]) + 175
    )


def test_pensions_count_as_taxable_income():
    """RF footnote 5: taxable income, so private pensions count against the line."""
    low = household([{"age": 70, "private_pension_income": 15_000}])
    high = household([{"age": 70, "private_pension_income": 30_000}])
    assert calc(low, preset("rf_flat")) == pytest.approx(175)
    assert calc(high, preset("rf_flat")) == 0


def test_earnings_only_income_test():
    high_pension = household([{"age": 70, "private_pension_income": 30_000}])
    changes = {**preset("rf_flat"), f"{P}.income_test.sources": ["employment_income"]}
    assert calc(high_pension, changes) == pytest.approx(175)


def test_passported_household_above_the_line():
    """Receipt of a Warm Home Discount benefit passports the household (RF fn. 2)."""
    situation = household([earner(30_000)], benunit={"universal_credit": 1_000})
    assert calc(situation, preset("rf_flat")) == pytest.approx(175)
    assert calc(situation, preset("rf_tiered")) == pytest.approx(220)
    assert calc(situation, preset("rf_tiered_own_income")) == pytest.approx(85)
    assert calc(situation, preset("passport_only")) == pytest.approx(175)


def test_passported_tiering_on_own_income():
    low = household([earner(10_000)], benunit={"universal_credit": 1_000})
    mid = household([earner(20_000)], benunit={"universal_credit": 1_000})
    assert calc(low, preset("rf_tiered_own_income")) == pytest.approx(220)
    assert calc(mid, preset("rf_tiered_own_income")) == pytest.approx(85)


def test_passport_only_excludes_the_income_route():
    situation = household([earner(10_000)])
    assert calc(situation, preset("passport_only")) == 0


def test_northern_ireland_is_out_of_scope():
    situation = household([earner(17_000)], region="NORTHERN_IRELAND")
    assert calc(situation, preset("rf_flat")) == 0
    assert calc(situation, {**preset("rf_flat"), f"{P}.gb_only": False}) == 175


def test_unit_rate_discount_scales_with_the_bill():
    situation = household([earner(17_000)], electricity=900, gas=600)
    changes = {
        **preset("rf_tiered"),
        f"{P}.unit_rate.in_effect": True,
        f"{P}.unit_rate.rate[0].amount": 0.10,
        f"{P}.unit_rate.rate[1].amount": 0.05,
    }
    assert calc(situation, changes) == pytest.approx(150)
    mid = household([earner(20_000)], electricity=900, gas=600)
    assert calc(mid, changes) == pytest.approx(75)


def test_non_claimants_on_the_income_route_get_nothing():
    """Take-up is set with set_input, as simulate.run does: policyengine-uk rebuilds a
    baseline from the same situation, so situations cannot name reform-only inputs."""

    def discount_without_claim(situation):
        sim = Simulation(situation=situation, scenario=scenario(preset("rf_flat")))
        sim.set_input("claims_targeted_energy_discount", YEAR, [False])
        return float(sim.calculate("targeted_energy_discount", YEAR)[0])

    income_only = household([earner(17_000)])
    passported = household([earner(17_000)], benunit={"universal_credit": 1_000})
    assert discount_without_claim(income_only) == 0
    assert discount_without_claim(passported) == pytest.approx(175)


def test_eligibility_variables():
    situation = household([earner(20_000), earner(12_000)])
    changes = preset("rf_tiered")
    assert calc(situation, changes, "targeted_energy_discount_highest_income") == 20_000
    assert calc(situation, changes, "targeted_energy_discount_income_route") == 1
    assert calc(situation, changes, "targeted_energy_discount_passported") == 0
    assert calc(situation, changes, "targeted_energy_discount_bill") == 1_500


def test_household_income_option():
    """RF's comparator (Figure 3): equivalised household income below 30,000 GBP on
    the modified OECD BHC scale (couple = 1.0, child under 14 = 0.2)."""
    two_earners = household([earner(23_000), earner(23_000)])
    # Pin UC at zero (not claiming) so only the income test applies.
    one_earner_family = household(
        [earner(29_000), {"age": 38}, {"age": 6}, {"age": 3}],
        benunit={"universal_credit": 0},
    )
    household_test = preset("rf_household_income")
    # 46,000 / 1.0 = 46,000 >= 30,000: fails the household test, passes the individual one.
    assert calc(two_earners, household_test) == 0
    assert calc(two_earners, preset("rf_flat")) == pytest.approx(175)
    # 29,000 / 1.4 = 20,714 < 30,000: passes the household test, fails the individual one.
    assert calc(
        one_earner_family, household_test, "targeted_energy_discount_tested_income"
    ) == pytest.approx(29_000 / 1.4)
    assert calc(one_earner_family, household_test) == pytest.approx(175)
    assert calc(one_earner_family, preset("rf_flat")) == 0
