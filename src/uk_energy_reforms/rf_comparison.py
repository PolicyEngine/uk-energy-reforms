"""PolicyEngine estimates next to the figures in RF's "Billing me softly".

RF uses the Family Resources Survey 2024-25 (GB) with the IPPR tax-benefit model, so the
like-for-like comparison is our 2024 run; 2026 (the scheme year) is shown for context.
RF's income tests exclude passporting (Figures 3 and 4 show passporting as its own
series), so the eligibility shares below are for the income test alone. RF counts
benefit units in its family-type figures, and so do the matching rows here.

The family-type rows come on two bases. The RF-comparable rows take the difference
between the two income-test series, as RF's p. 7-8 figures do, without netting out
passporting. The policy rows net it out: units whose household actually loses (or
gains) the discount, since passported households are eligible under both options. RF
publishes only the first.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from uk_energy_reforms import analysis, calibrate
from uk_energy_reforms.reforms.targeted_energy_discount import preset
from uk_energy_reforms.reforms.targeted_energy_discount.presets import P
from uk_energy_reforms.simulate import benunit_frame, run

BUDGET = 2e9

RF_FIGURES = [
    {
        "id": "gb_households_m",
        "label": "Households in Great Britain (millions)",
        "rf": 28.0,
        "rf_statement": "Gathering details from all 28 million households",
        "page": 3,
        "unit": "millions",
    },
    {
        "id": "passport_share",
        "label": "Share of households passported (modelled receipt, with take-up)",
        "rf": 0.25,
        "rf_statement": "Passporting reaches around a quarter of households",
        "page": 1,
        "unit": "share",
    },
    {
        "id": "passport_share_reported",
        "label": "Share of households passported (reported receipt, RF's basis)",
        "rf": 0.25,
        "rf_statement": "Passporting reaches around a quarter of households",
        "page": 1,
        "unit": "share",
    },
    {
        "id": "income_test_share",
        "label": "Share of households whose highest individual income is below £24,000",
        "rf": 0.40,
        "rf_statement": "A £24,000 threshold reaches around 40% of households",
        "page": 1,
        "unit": "share",
    },
    {
        "id": "income_test_bottom4",
        "label": "Share of the four lowest income deciles passing the £24,000 individual test",
        "rf": 0.75,
        "rf_statement": "The individual option covers 75% of the poorest four deciles",
        "page": 6,
        "unit": "share",
    },
    {
        "id": "household_test_share",
        "label": "Share of households with equivalised household income below £30,000",
        "rf": 0.40,
        "rf_statement": "Both options target around 40% of households",
        "page": 6,
        "unit": "share",
    },
    {
        "id": "household_test_bottom4",
        "label": "Share of the four lowest income deciles passing the £30,000 household test",
        "rf": 0.78,
        "rf_statement": "The household option covers 78% of the poorest four deciles",
        "page": 6,
        "unit": "share",
    },
    {
        "id": "couples_children_household_eligible_m",
        "label": "Couples with children (benefit units) passing the household income test (m)",
        "rf": 1.8,
        "rf_statement": "1.8 million such families eligible under the household option",
        "page": 7,
        "unit": "millions",
    },
    {
        "id": "couples_children_lose_k",
        "label": "Of those, failing the individual income test (RF's basis: passporting not netted out; thousands)",
        "rf": 490,
        "rf_statement": "490,000 would not be eligible under the individual option",
        "page": 7,
        "unit": "thousands",
    },
    {
        "id": "couples_children_lose_bottom_quintile",
        "label": "Share of those couples in the lowest income fifth (RF's basis)",
        "rf": 0.71,
        "rf_statement": "71% of them are in the poorest fifth",
        "page": 7,
        "unit": "share",
    },
    {
        "id": "couples_children_lose_policy_k",
        "label": "Of those, losing the discount under the individual option (policy count: not passported; thousands)",
        "rf": None,
        "rf_statement": "Not published: RF's 490,000 does not net out passporting",
        "page": 7,
        "unit": "thousands",
    },
    {
        "id": "couples_children_lose_policy_bottom_quintile",
        "label": "Share of those couples in the lowest income fifth (policy count)",
        "rf": None,
        "rf_statement": "Not published",
        "page": 7,
        "unit": "share",
    },
    {
        "id": "pensioners_gain_k",
        "label": "Pensioner units passing the individual test but not the household one (RF's basis; thousands)",
        "rf": 780,
        "rf_statement": "780,000 pensioner households would become eligible",
        "page": 8,
        "unit": "thousands",
    },
    {
        "id": "pensioners_gain_decile5plus",
        "label": "Share of those pensioner units in decile five or above (RF's basis)",
        "rf": 0.81,
        "rf_statement": "81% of them (630,000) are in decile five or above",
        "page": 8,
        "unit": "share",
    },
    {
        "id": "pensioners_gain_policy_k",
        "label": "Pensioner units gaining the discount only under the individual option (policy count: not passported; thousands)",
        "rf": None,
        "rf_statement": "Not published: RF's 780,000 does not net out passporting",
        "page": 8,
        "unit": "thousands",
    },
    {
        "id": "pensioners_gain_policy_decile5plus",
        "label": "Share of those pensioner units in decile five or above (policy count)",
        "rf": None,
        "rf_statement": "Not published",
        "page": 8,
        "unit": "share",
    },
    {
        "id": "flat_average_at_budget",
        "label": "Average support per eligible household in a £2bn flat scheme (£)",
        "rf": 175,
        "rf_statement": "A £2bn scheme gives an average of £175 per eligible household",
        "page": 9,
        "unit": "gbp",
    },
    {
        "id": "flat_average_at_budget_income_test",
        "label": "Same, dividing £2bn among households passing the income test only (£)",
        "rf": 175,
        "rf_statement": "A £2bn scheme gives an average of £175 per eligible household",
        "page": 9,
        "unit": "gbp",
    },
    {
        "id": "tiered_low_at_budget",
        "label": "Tiered £2bn scheme: support below £18,000 (£)",
        "rf": 220,
        "rf_statement": "Around £220 for households below £18,000",
        "page": 9,
        "unit": "gbp",
    },
    {
        "id": "tiered_high_at_budget",
        "label": "Tiered £2bn scheme: support from £18,000 to £24,000 (£)",
        "rf": 85,
        "rf_statement": "Around £85 for households from £18,000 to £24,000",
        "page": 9,
        "unit": "gbp",
    },
    {
        "id": "tiered_low_at_budget_income_test",
        "label": "Tiered £2bn among income-test households only: below £18,000 (£)",
        "rf": 220,
        "rf_statement": "Around £220 for households below £18,000",
        "page": 9,
        "unit": "gbp",
    },
    {
        "id": "tiered_high_at_budget_income_test",
        "label": "Tiered £2bn among income-test households only: £18,000 to £24,000 (£)",
        "rf": 85,
        "rf_statement": "Around £85 for households from £18,000 to £24,000",
        "page": 9,
        "unit": "gbp",
    },
]

NOT_MODELLED = [
    {
        "rf_statement": (
            "More than 15% of second-quintile households could not afford to keep "
            "their home warm in 2022-23"
        ),
        "page": 5,
        "reason": (
            "The HBAI material-deprivation item is not in either microdata file, so "
            "this analysis proxies hardship with poverty, the four lowest income deciles and "
            "energy spend above 10% of net income."
        ),
    },
    {
        "rf_statement": "Income is assessed over the three months before the scheme",
        "page": 8,
        "reason": "The microdata carry annual incomes only.",
    },
]

PENSIONER_TYPES = ["Single pensioner", "Pensioner couple"]

# Reported receipt of the Warm Home Discount benefits, as RF's Figures 1, 3 and 4 use.
REPORTED_PASSPORT = [
    "universal_credit_reported",
    "pension_credit_reported",
    "housing_benefit_reported",
    "esa_income_reported",
    "jsa_income_reported",
    "income_support_reported",
]


def _w(f, mask):
    return float(f.weight[np.asarray(mask)].sum())


def _share(f, mask, base):
    base = np.asarray(base)
    return float(f.weight[np.asarray(mask) & base].sum() / f.weight[base].sum())


def estimates(dataset: str, year: int) -> dict:
    """Our value for each RF figure on one dataset and year."""
    individual = run(dataset, year, preset("rf_flat"))
    household = run(dataset, year, preset("rf_household_income"))
    tiered = run(dataset, year, preset("rf_tiered"))
    tiered_own = run(dataset, year, preset("rf_tiered_own_income"))
    # RF's passporting is reported receipt in the FRS; ours is modelled receipt.
    reported = run(
        dataset,
        year,
        {**preset("rf_flat"), f"{P}.passport.benefits": REPORTED_PASSPORT},
    )

    fi = analysis.prepare(individual)
    fh = analysis.prepare(household)
    fr = analysis.prepare(reported)
    everyone = np.ones(len(fi), bool)
    ind_route = fi.income_route.values
    hh_route = fh.income_route.values
    passported = fi.passported.values

    # Family-type rows count benefit units wherever they live (RF's Figure 4 unit) with
    # person-weighted AHC deciles (the HBAI convention RF's fn 6 cites), on two bases:
    # RF's (the difference between the two income-test series) and the policy count
    # (netting out passporting, which makes a household eligible under both options).
    by_id = fi.set_index("household_id")
    units = benunit_frame(dataset, year)
    units = units[units.household_id.isin(fi.household_id)]
    hid = units.household_id.values
    u_ind = by_id.income_route.reindex(hid).values.astype(bool)
    u_hh = fh.set_index("household_id").income_route.reindex(hid).values.astype(bool)
    u_pass = by_id.passported.reindex(hid).values.astype(bool)
    u_multi = by_id.household_type.reindex(hid).values == "Multi-family household"
    u_dec = by_id.decile_ahc.reindex(hid).values
    u_dec_hhw = (
        pd.Series(
            analysis._deciles(fi.eq_ahc_base.values, fi.weight.values),
            index=fi.household_id.values,
        )
        .reindex(hid)
        .values
    )
    u_w = units.weight.values
    u_couples = units.couple_with_children.values & u_hh
    u_lose_rf = u_couples & ~u_ind
    u_gain_rf = units.pensioner.values & u_ind & ~u_hh
    u_lose = u_lose_rf & ~u_pass
    u_gain = u_gain_rf & ~u_pass

    def u_share(mask, base):
        return float(u_w[mask & base].sum() / u_w[base].sum())

    # The same rows counted as households with a single benefit unit.
    couples = (fi.household_type == "Couple with children").values
    pensioners = fi.household_type.isin(PENSIONER_TYPES).values
    lose_rf = couples & hh_route & ~ind_route
    gain_rf = pensioners & ind_route & ~hh_route
    lose = lose_rf & ~passported
    gain = gain_rf & ~passported

    # RF's averages look costed over households passing the income test (about 40% of
    # households), so also divide the budget among those alone, tiered by own income.
    tested = fi.tested_income.values
    n_low = _w(fi, ind_route & (tested < 18_000))
    n_high = _w(fi, ind_route & (tested >= 18_000))
    income_test_factor = BUDGET / (220 * n_low + 85 * n_high)

    tiered_factor = BUDGET / calibrate.cost(tiered)
    own_factor = BUDGET / calibrate.cost(tiered_own)
    amounts = tiered.schedule["amounts"]
    own_amounts = tiered_own.schedule["amounts"]
    multi = (fi.household_type == "Multi-family household").values
    return {
        "gb_households_m": _w(fi, everyone) / 1e6,
        "passport_share": _share(fi, fi.passported, everyone),
        "passport_share_reported": _share(fr, fr.passported, everyone),
        "income_test_share": _share(fi, ind_route, everyone),
        "income_test_bottom4": _share(fi, ind_route, fi.bottom4),
        "household_test_share": _share(fh, hh_route, everyone),
        "household_test_bottom4": _share(fh, hh_route, fh.bottom4),
        "couples_children_household_eligible_m": u_w[u_couples].sum() / 1e6,
        "couples_children_lose_k": u_w[u_lose_rf].sum() / 1e3,
        "couples_children_lose_bottom_quintile": u_share(u_dec <= 2, u_lose_rf),
        "couples_children_lose_policy_k": u_w[u_lose].sum() / 1e3,
        "couples_children_lose_policy_bottom_quintile": u_share(u_dec <= 2, u_lose),
        "pensioners_gain_k": u_w[u_gain_rf].sum() / 1e3,
        "pensioners_gain_decile5plus": u_share(u_dec >= 5, u_gain_rf),
        "pensioners_gain_policy_k": u_w[u_gain].sum() / 1e3,
        "pensioners_gain_policy_decile5plus": u_share(u_dec >= 5, u_gain),
        # Alternatives: household-weighted deciles, and single-unit households.
        "couples_children_lose_bottom_quintile_hhw": u_share(u_dec_hhw <= 2, u_lose_rf),
        "couples_children_lose_policy_bottom_quintile_hhw": u_share(
            u_dec_hhw <= 2, u_lose
        ),
        "pensioners_gain_decile5plus_hhw": u_share(u_dec_hhw >= 5, u_gain_rf),
        "pensioners_gain_policy_decile5plus_hhw": u_share(u_dec_hhw >= 5, u_gain),
        "couples_children_household_eligible_m_households": _w(fi, couples & hh_route)
        / 1e6,
        "couples_children_lose_k_households": _w(fi, lose_rf) / 1e3,
        "couples_children_lose_policy_k_households": _w(fi, lose) / 1e3,
        "couples_children_lose_bottom_quintile_households": _share(
            fi, fi.decile_ahc.values <= 2, lose_rf
        ),
        "pensioners_gain_k_households": _w(fi, gain_rf) / 1e3,
        "pensioners_gain_policy_k_households": _w(fi, gain) / 1e3,
        "pensioners_gain_decile5plus_households": _share(
            fi, fi.decile_ahc.values >= 5, gain_rf
        ),
        # Composition behind the pensioner row: pensioner units living with other
        # benefit units (for example adult children in work) pass the individual test
        # and can fail the household one.
        "multi_family_household_share": _share(fi, multi, everyone),
        "pensioners_gain_in_multi_family_share": u_share(u_multi, u_gain_rf),
        "pensioners_gain_policy_in_multi_family_share": u_share(u_multi, u_gain),
        "flat_average_at_budget": BUDGET / _w(fi, fi.recipient),
        "flat_average_at_budget_income_test": BUDGET / _w(fi, ind_route),
        "tiered_low_at_budget_income_test": 220 * income_test_factor,
        "tiered_high_at_budget_income_test": 85 * income_test_factor,
        "tiered_low_at_budget": amounts[0] * tiered_factor,
        "tiered_high_at_budget": amounts[1] * tiered_factor,
        "tiered_low_at_budget_own_income": own_amounts[0] * own_factor,
        "tiered_high_at_budget_own_income": own_amounts[1] * own_factor,
        "cost_flat_at_175_bn": calibrate.cost(individual) / 1e9,
        "cost_tiered_at_220_85_bn": calibrate.cost(tiered) / 1e9,
        "cost_tiered_own_income_at_220_85_bn": calibrate.cost(tiered_own) / 1e9,
        "sample_n_couples_children_lose": int(u_lose_rf.sum()),
        "sample_n_couples_children_lose_policy": int(u_lose.sum()),
        "sample_n_pensioners_gain": int(u_gain_rf.sum()),
        "sample_n_pensioners_gain_policy": int(u_gain.sum()),
    }


def compare(datasets: list[str], years: list[int]) -> dict:
    values = {d: {str(y): estimates(d, y) for y in years} for d in datasets}
    rows = []
    for figure in RF_FIGURES:
        rows.append(
            {
                **figure,
                "policyengine": {
                    d: {y: v[figure["id"]] for y, v in by_year.items()}
                    for d, by_year in values.items()
                },
            }
        )
    return {
        "figures": rows,
        "extra": values,
        "not_modelled": NOT_MODELLED,
        "notes": [
            "RF: Family Resources Survey 2024-25, GB, with the IPPR tax-benefit model.",
            "Eligibility shares are for the income test alone; passporting is separate.",
            (
                "Passporting uses modelled receipt with the datasets' take-up draws; "
                "RF uses receipt reported in the FRS, which is also shown."
            ),
            (
                "Family-type rows count benefit units wherever they live, as RF's "
                "Figure 4 does, on two bases. RF's basis is the difference between the "
                "two income-test series, without netting out passporting, which is what "
                "RF's 490,000 and 780,000 measure. The policy count nets it out: units "
                "whose household actually loses (or gains) the discount, since passported "
                "households are eligible under both options. RF does not publish it."
            ),
            (
                "Deciles are person-weighted equivalised AHC household income deciles "
                "(the HBAI convention; our choice, as RF does not say). "
                "Household-weighted versions are in `extra` (*_hhw), and counts of "
                "households with a single benefit unit in `extra` (*_households)."
            ),
            (
                "£2bn averages divide £2bn among all recipients (passported or passing "
                "the test), and separately among households passing the income test "
                "only, which is closer to how RF's averages appear to be costed. For the "
                "tiered option, RF does not say which tier passported households get; "
                "the all-recipient figure places them in the top tier."
            ),
        ],
    }
