"""PolicyEngine estimates next to the figures in RF's "Billing me softly".

RF uses the Family Resources Survey 2024-25 (GB) with the IPPR tax-benefit model, so the
like-for-like comparison is our 2024 run; 2026 (the scheme year) is shown for context.
RF's income tests exclude passporting (Figures 3 and 4 show passporting as its own
series), so the eligibility shares below are for the income test alone. RF counts
benefit units in its family-type figures; we count households of one benefit unit.
"""

from __future__ import annotations

import numpy as np

from uk_energy_reforms import analysis, calibrate
from uk_energy_reforms.reforms.targeted_energy_discount import preset
from uk_energy_reforms.simulate import run

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
        "label": "Share of households passported by means-tested benefits",
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
        "label": "Share of the poorest four deciles passing the £24,000 individual test",
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
        "label": "Share of the poorest four deciles passing the £30,000 household test",
        "rf": 0.78,
        "rf_statement": "The household option covers 78% of the poorest four deciles",
        "page": 6,
        "unit": "share",
    },
    {
        "id": "couples_children_household_eligible_m",
        "label": "Working-age couples with children eligible under the household test (m)",
        "rf": 1.8,
        "rf_statement": "1.8 million such families eligible under the household option",
        "page": 7,
        "unit": "millions",
    },
    {
        "id": "couples_children_lose_k",
        "label": "Of those, not eligible under the individual test (thousands)",
        "rf": 490,
        "rf_statement": "490,000 would not be eligible under the individual option",
        "page": 7,
        "unit": "thousands",
    },
    {
        "id": "couples_children_lose_bottom_quintile",
        "label": "Share of those couples with children in the poorest fifth",
        "rf": 0.71,
        "rf_statement": "71% of them are in the poorest fifth",
        "page": 7,
        "unit": "share",
    },
    {
        "id": "pensioners_gain_k",
        "label": "Pensioner households eligible only under the individual test (thousands)",
        "rf": 780,
        "rf_statement": "780,000 pensioner households would become eligible",
        "page": 8,
        "unit": "thousands",
    },
    {
        "id": "pensioners_gain_decile5plus",
        "label": "Share of those pensioner households in decile five or above",
        "rf": 0.81,
        "rf_statement": "81% of them (630,000) are in decile five or above",
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
            "this analysis proxies hardship with poverty, the poorest four deciles and "
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

    fi = analysis.prepare(individual)
    fh = analysis.prepare(household)
    everyone = np.ones(len(fi), bool)
    ind_route = fi.income_route.values
    hh_route = fh.income_route.values
    couples = (fi.household_type == "Couple with children").values
    pensioners = fi.household_type.isin(PENSIONER_TYPES).values
    lose = couples & hh_route & ~ind_route
    gain = pensioners & ind_route & ~hh_route

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
    return {
        "gb_households_m": _w(fi, everyone) / 1e6,
        "passport_share": _share(fi, fi.passported, everyone),
        "income_test_share": _share(fi, ind_route, everyone),
        "income_test_bottom4": _share(fi, ind_route, fi.bottom4),
        "household_test_share": _share(fh, hh_route, everyone),
        "household_test_bottom4": _share(fh, hh_route, fh.bottom4),
        "couples_children_household_eligible_m": _w(fi, couples & hh_route) / 1e6,
        "couples_children_lose_k": _w(fi, lose) / 1e3,
        "couples_children_lose_bottom_quintile": _share(
            fi, fi.decile_ahc.values <= 2, lose
        ),
        "pensioners_gain_k": _w(fi, gain) / 1e3,
        "pensioners_gain_decile5plus": _share(fi, fi.decile_ahc.values >= 5, gain),
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
        "sample_n_couples_children_lose": int(lose.sum()),
        "sample_n_pensioners_gain": int(gain.sum()),
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
                "RF counts benefit units in family-type figures; PolicyEngine counts "
                "households with one benefit unit, so multi-family households are left "
                "out of those rows."
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
