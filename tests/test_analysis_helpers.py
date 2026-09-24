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
