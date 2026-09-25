"""Unit tests for household types, calibration and cliff helpers (no simulation)."""

import numpy as np
import pandas as pd
import pytest

from uk_energy_reforms import analysis, calibrate
from uk_energy_reforms.household_types import classify
from uk_energy_reforms.reforms.targeted_energy_discount.presets import P
from uk_energy_reforms.simulate import Run


def test_household_types():
    person = pd.DataFrame(
        [
            # household, benunit, is_child, over State Pension age
            (1, 1, False, True),  # single pensioner
            (2, 2, False, True),
            (2, 2, False, False),  # pensioner couple (one partner over SPA)
            (3, 3, False, False),  # single, no children
            (4, 4, False, False),
            (4, 4, False, False),  # couple, no children
            (5, 5, False, False),
            (5, 5, True, False),  # lone parent
            (6, 6, False, False),
            (6, 6, False, False),
            (6, 6, True, False),  # couple with children
            (7, 7, False, True),
            (7, 8, False, False),  # parent and adult child: two benefit units
            (8, 9, False, True),
            (8, 9, True, False),  # pensioner with a dependent child
        ],
        columns=["household_id", "benunit_id", "is_child", "sp_age"],
    )
    assert classify(person).to_dict() == {
        1: "Single pensioner",
        2: "Pensioner couple",
        3: "Single, no children",
        4: "Couple, no children",
        5: "Lone parent",
        6: "Couple with children",
        7: "Multi-family household",
        8: "Lone parent",
    }


def fixed_run():
    frame = pd.DataFrame(
        {
            "discount": [220.0, 220.0, 85.0, 0.0],
            "assessed_income": [5_000, 10_000, 20_000, 30_000],
            "bill": [1_000.0, 3_000.0, 1_700.0, 2_000.0],
            "weight": [3.0, 1.0, 1.0, 1.0],
            "gb": [True] * 4,
        }
    )
    schedule = {
        "bill_share": False,
        "thresholds": [0.0, 18_000.0, 24_000.0],
        "amounts": [220.0, 85.0, 0.0],
        "rate_thresholds": [0.0, 18_000.0, 24_000.0],
        "rates": [0.0, 0.0, 0.0],
    }
    return Run("test", 2026, {f"{P}.in_effect": True}, frame, schedule)


def test_bill_shares_reproduce_tier_averages():
    changes = calibrate.bill_share_changes(fixed_run())
    # Tier 1: weighted mean bill (3 x 1,000 + 1 x 3,000) / 4 = 1,500 -> 220 / 1,500.
    assert changes[f"{P}.bill_share.rate[0].amount"] == pytest.approx(220 / 1_500)
    assert changes[f"{P}.bill_share.rate[1].amount"] == pytest.approx(85 / 1_700)
    assert changes[f"{P}.bill_share.rate[2].amount"] == 0
    assert changes[f"{P}.bill_share.in_effect"] is True


def test_budget_rescaling():
    run = fixed_run()
    # Cost = 3 x 220 + 220 + 85 = 965.
    changes = calibrate.budget_changes(run, 1_930)
    assert changes[f"{P}.amount[0].amount"] == pytest.approx(440)
    assert changes[f"{P}.amount[1].amount"] == pytest.approx(170)


def test_cliff_thresholds_and_support_below():
    schedule = fixed_run().schedule
    assert analysis.cliff_thresholds(schedule) == [18_000.0, 24_000.0]
    frame = pd.DataFrame({"bill": [1_000.0]})
    assert analysis._support_below(frame, schedule, 24_000.0)[0] == 85
    assert analysis._support_below(frame, schedule, 18_000.0)[0] == 220
    unit = {**schedule, "bill_share": True, "rates": [0.2, 0.1, 0.0]}
    assert analysis._support_below(frame, unit, 24_000.0)[0] == pytest.approx(100)


def test_deciles_are_person_weighted():
    values = np.array([1.0, 2.0, 3.0, 4.0])
    weights = np.array([1.0, 1.0, 1.0, 7.0])
    # Shares of people with lower income: 0, 0.1, 0.2, 0.3.
    assert list(analysis._deciles(values, weights)) == [1, 2, 3, 4]


def test_no_cliffs_without_an_income_test():
    schedule = {**fixed_run().schedule, "income_test": False}
    assert analysis.cliff_thresholds(schedule) == []


def test_dead_zone_width_uses_the_top_earners_marginal_rate():
    """£175 lost: a pensioner top earner (basic rate, no NI) needs £175 / 0.80 = £218.75
    more gross income; a working-age one (basic rate + 8% NI) £175 / 0.72 = £243.06.
    Under the household-income test the width is in equivalised income."""
    frame = pd.DataFrame(
        {
            "top_earner_pensioner": [True, False, False],
            "equivalisation_bhc": [1, 1, 1.4],
        }
    )
    drop = np.array([175.0, 175.0, 175.0])
    widths = analysis.dead_zone_width(frame, drop, {"household_equivalised": False})
    assert widths[0] == pytest.approx(218.75)
    assert widths[1] == pytest.approx(175 / 0.72)
    household = analysis.dead_zone_width(frame, drop, {"household_equivalised": True})
    assert household[2] == pytest.approx(175 / 0.72 / 1.4)


def test_gini_and_top_share():
    """Equal incomes give 0; one person with everything out of four gives 1 - 1/4."""
    equal = np.array([10.0, 10.0, 10.0, 10.0])
    weights = np.ones(4)
    assert analysis._gini(equal, weights) == pytest.approx(0.0)
    assert analysis._gini(np.array([0.0, 0.0, 0.0, 1.0]), weights) == pytest.approx(
        0.75
    )
    # Ten people, the richest holds 10 of 19: top 10% share = 10 / 19.
    values = np.array([1.0] * 9 + [10.0])
    assert analysis._top_share(values, np.ones(10), 0.10) == pytest.approx(10 / 19)
    # Two equally weighted people with 2 and 1: the top 25% is half of the richer one.
    assert analysis._top_share(np.array([2.0, 1.0]), np.ones(2), 0.25) == pytest.approx(
        1 / 3
    )


def test_winner_bands():
    """Relative change in net income: 10% and 0.44% gains, a 0.05% gain (no change)
    and a household with no income that gains (more than 5%)."""
    frame = pd.DataFrame(
        {"net_bhc_base": [1_000.0, 40_000.0, 40_000.0, 0.0], "gain": [100, 175, 20, 50]}
    )
    rel = analysis._relative_change(frame)
    bands = [
        next(name for name, lo, hi in analysis.WINNER_BANDS if lo < r <= hi)
        for r in rel
    ]
    assert bands == [
        "gain_more_than_5pct",
        "gain_less_than_5pct",
        "no_change",
        "gain_more_than_5pct",
    ]


def test_household_incomes():
    """Taxable income summed over members, members with income, and the second-highest
    member's income, including a household with no income and a negative income."""
    from uk_energy_reforms.simulate import household_incomes

    person = pd.DataFrame(
        {
            "household_id": [1, 1, 1, 2, 3, 3],
            "total_income": [20_000.0, 15_000.0, 0.0, 0.0, 30_000.0, -500.0],
        }
    )
    out = household_incomes(person)
    assert out.taxable_income.to_dict() == {1: 35_000, 2: 0, 3: 29_500}
    assert out.n_incomes.to_dict() == {1: 2, 2: 0, 3: 1}
    assert out.second_income.to_dict() == {1: 15_000, 2: 0, 3: -500}


def test_quantile_groups_keep_ties_together():
    values = [0, 0, 0, 5, 6, 7, 8, 9, 10, 11]
    groups = analysis._quantile_groups(values, np.ones(10), 5)
    assert list(groups) == [1, 1, 1, 2, 3, 3, 4, 4, 5, 5]
    # Weighted: the first household holds half the weight, so the second starts the
    # upper half.
    assert list(analysis._quantile_groups([1, 2, 3], [2.0, 1.0, 1.0], 2)) == [1, 2, 2]


def distribution_frame():
    """Ten households, one per income step, with two eligibility routes."""
    n = 10
    income = np.arange(1, n + 1) * 10_000.0
    passported = np.array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0], bool)
    income_only = np.array([0, 0, 1, 0, 0, 0, 1, 0, 0, 0], bool)
    eligible = passported | income_only
    discount = np.where(eligible, 175.0, 0.0)
    return pd.DataFrame(
        {
            "weight": np.ones(n),
            "n_people": np.full(n, 2),
            "n_children": np.zeros(n),
            "eligible": eligible,
            "passported": passported,
            "income_only": income_only,
            "discount": discount,
            "gain": discount,
            "rel_pov_bhc_base": np.arange(n) < 2,
            "rel_pov_ahc_base": np.arange(n) < 3,
            "eq_bhc_base": income,
            "eq_ahc_base": income,
            "net_bhc_base": income,
            "net_ahc_base": income,
            "taxable_income": income,
            "highest_income": income / 2,
            "second_income": np.where(np.arange(n) == 6, 20_000.0, 0.0),
            "n_incomes": np.where(np.arange(n) == 6, 2, 1),
            "household_type": ["Couple, no children"] * n,
        }
    )


def test_income_distributions_shares_and_groups():
    frame = distribution_frame()
    schedule = {
        "income_test": True,
        "household_equivalised": False,
        "thresholds": [0.0, 18_000.0, 24_000.0],
    }
    out = analysis.income_distributions(Run("test", 2026, {}, frame, schedule), frame)
    for measure in out["distributions"].values():
        rows = measure["deciles"]
        for row in rows:
            total = row["passported"] + row["income_only"] + row["not_eligible"]
            assert total == pytest.approx(1)
        assert sum(r["cost_share"] for r in rows) == pytest.approx(1)
    taxable = out["distributions"]["taxable"]
    # Deciles 1-3 hold households 1-3: the third is not passported but qualifies
    # through the income test, so nobody in them is left out.
    assert taxable["low_not_eligible"]["households_m"] == 0
    # Deciles 6-10: household 7 qualifies through the income test alone.
    top = taxable["top_income_only"]
    assert top["households_m"] == pytest.approx(1e-6)
    assert top["share_of_base"] == pytest.approx(0.5)
    assert top["two_incomes_over_pa"] == pytest.approx(1)
    assert top["taxable_at_or_above_line"] == pytest.approx(1)
    assert top["cost_share"] == pytest.approx(175 / (4 * 175))
    # Passported households are in deciles 1 and 2, so none is in the top half.
    assert taxable["top_passported"]["households_m"] == 0
    cells = out["crosstabs"]["eq_ahc|taxable"]["cells"]
    assert sum(c["household_share"] for c in cells) == pytest.approx(1)


def test_household_income_test_has_no_individual_line_share():
    frame = distribution_frame()
    schedule = {
        "income_test": True,
        "household_equivalised": True,
        "thresholds": [0.0, 30_000.0, 30_000.0],
    }
    out = analysis.income_distributions(Run("test", 2026, {}, frame, schedule), frame)
    assert (
        out["distributions"]["taxable"]["top_income_only"]["taxable_at_or_above_line"]
        is None
    )


def test_round_to_significant_figures():
    from uk_energy_reforms.dashboard_data import _round

    assert _round(
        {"a": 0.123456, "b": 123_456.7, "c": float("nan"), "d": 3, "e": [0.0]}
    ) == {"a": 0.1235, "b": 123_500.0, "c": None, "d": 3, "e": [0.0]}
