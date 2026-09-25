# uk-energy-reforms

PolicyEngine UK reforms and analysis for household energy bill support. Each reform is
installed into [policyengine-uk](https://github.com/PolicyEngine/policyengine-uk) at
runtime as parameters and variables. Reforms are switched and tuned with ordinary
parameter-change dicts, so the same code serves household calculations, microsimulation
runs and, later, a dashboard.

## Reforms

### Targeted energy discount (`reforms/targeted_energy_discount`)

The Resolution Foundation's proposal in
[*Billing me softly*](https://www.resolutionfoundation.org/publications/billing-me-softly/)
(Brewer, Clegg and Marshall, 10 August 2026). A household in Great Britain is eligible if:

- it receives a passporting benefit (the Warm Home Discount list: Universal Credit,
  Pension Credit, Housing Benefit, income-related ESA, income-based JSA, Income Support); or
- the highest *taxable income* of any member is below the threshold. Taxable income is
  `total_income`, so pensions count as well as earnings.

Support follows a schedule by the household's assessed income. Passported households are
placed at the lower of their own income and `passport.assessed_income`.

The parameters live under `gov.contrib.targeted_energy_discount` (see `parameters.yaml`):

- `in_effect` switches the scheme on. It is off by default, which leaves the system
  numerically identical to the policyengine-uk baseline.
- `amount` is a three-bracket schedule by assessed income, in GBP per household.
- `bill_share.in_effect` with `bill_share.rate` switches to a bill-share discount: a
  percentage off the household's annual gas and electricity spend. RF proposes a cut in
  unit prices (pence per kWh); the microdata hold annual spend, not kWh, so this also
  discounts standing charges and gives low-consumption households relatively more than a
  per-kWh cut would. The rates default to zero; each run's receipt records the rates used.
- `passport.in_effect`, `passport.benefits` and `passport.assessed_income` control
  passporting.
- `income_test.in_effect` and `income_test.sources` control the income test.
  `income_test.sources` is the list of person-level income variables; use
  `[employment_income, self_employment_income]` for an earnings test.
  `income_test.household_equivalised` switches to RF's comparator: total household income
  divided by the modified-OECD BHC equivalisation factor.
- `gb_only` leaves out Northern Ireland, whose bills sit outside the Ofgem cap.
- `count_in_hbai_income` makes the discount count as HBAI income, as DWP does for the Warm
  Home Discount. Set it to false to treat the discount as a price cut instead, as
  policyengine-uk does for the 2022 Energy Price Guarantee.

The discount always adds to `household_benefits`, and so to `household_net_income`, and
to `gov_spending`.

Presets (`presets.py`) use RF's published averages for a £2bn scheme:

- `rf_flat`: £175 per household below £24,000, and for every passported household.
- `rf_tiered`: £220 below £18,000, £85 from £18,000 to £24,000. Passported households get
  £220.
- `rf_tiered_own_income`: as `rf_tiered`, but passported households are tiered on their own
  income, with £85 as the floor. RF does not say which tier passported households get.
- `rf_household_income`: RF's comparator, £175 where equivalised household income is below
  £30,000, or passported.
- `passport_only`: passporting alone at £175, a Warm-Home-Discount-style comparator.

`calibrate.py` turns any fixed-amount run into a bill-share schedule. Brackets paying the
same amount share one rate, so the average payment matches across those brackets
combined. It also rescales any schedule to a budget.

## Usage

```bash
uv sync --extra dev
export HF_TOKEN=...   # read access to the pinned private datasets
```

Household calculation:

```python
from policyengine_uk import Simulation
from uk_energy_reforms.reforms.targeted_energy_discount import preset, scenario

sim = Simulation(situation=..., scenario=scenario(preset("rf_tiered")))
sim.calculate("targeted_energy_discount", 2026)
```

Microsimulation with baseline and reform side by side:

```python
from uk_energy_reforms.simulate import run

r = run("microcosm_979", 2026, preset("rf_tiered"))  # r.frame: one row per household
```

Full receipt (JSON plus markdown with breakdowns by region, household type and decile,
poverty impacts, winners and losers, inequality, coverage of households in poverty or with high energy costs, cliff
edges and the baseline the scheme acts on):

```bash
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2026 \
  --presets rf_flat rf_tiered --bill-share --budget 2e9 --out analyses/<name>/results
```

Our estimates beside the figures RF publishes (2024-25 like-for-like, and 2026-27), and the
pre-computed data files for the dashboard (added in a follow-up PR): the results for every
`results-<year>` folder in the analysis, and the household-calculator cases the dashboard's
JavaScript calculator is tested against:

```bash
uv run uk-energy-reforms rf-compare --out analyses/<name>
uv run uk-energy-reforms export-dashboard --analysis analyses/<name> \
  --out dashboard/public/data/targeted_energy_discount_results.json \
  --calculator-out dashboard/public/data/calculator.json
```

`--take-up` sets take-up among households eligible only through the income test (they
must self-declare). Passported households are enrolled automatically. Draws are seeded
and are set as an input, because policyengine-core forbids randomness inside formulas.

## Datasets

`datasets.py` pins each dataset by Hugging Face revision and sha256:

- `microcosm_979`: the staged Microcosm UK 2024-25 national attempt
  `uk-frs-calibration-attempt-20260923T134002Z-c1be1c9f`.
- `efrs_1573`: Enhanced FRS 2024-25 from policyengine-uk-data 1.57.3.

Use Microcosm for anything below national totals. eFRS weights are highly concentrated
(Kish effective sample size about 1,100).

policyengine-uk does not uprate `electricity_consumption` or `gas_consumption` between
years. [policyengine-uk#1860](https://github.com/PolicyEngine/policyengine-uk/pull/1860) added CPI uprating; [policyengine-uk#1868](https://github.com/PolicyEngine/policyengine-uk/pull/1868) removed it again, because
policyengine-uk-data prices the Enhanced FRS at Ofgem April–June 2026 unit rates. Spend
therefore stays at each dataset's stored price level in every year: April–June 2026 for the
Enhanced FRS and 2024-25 for Microcosm. Ofgem's typical-use cap averaged within 2% of its
April–June 2026 level over 2024-25, so the two datasets sit at about the same price level.
Both sit below this winter's cap (October–December 2026 is 17–18% above April–June 2026), so
bill levels, bill-share payments and energy-burden shares are understated in the scheme years
on both. Fixed amounts and eligibility do not depend on spend.

## Notes

- Situations cannot name reform-only input variables such as
  `claims_targeted_energy_discount`, because policyengine-uk rebuilds a baseline from the
  same situation. Set them with `sim.set_input(...)` instead.
- Neither dataset records prepayment meters, off-grid heating fuel, EPC bands or the
  HBAI heating-affordability item. Hardship is proxied by poverty, the four lowest income
  deciles and energy spend above 10% of net income.

## Layout

```
src/uk_energy_reforms/
  reforms/targeted_energy_discount/   parameters.yaml, variables.py, reform.py, presets.py
  datasets.py        pinned microdata
  simulate.py        baseline + reform household frames
  calibrate.py       bill shares and budget scaling
  household_types.py RF-aligned household types
  analysis.py        impacts, winners and losers, inequality, coverage, cliffs,
                     breakdowns, baseline
  report.py, cli.py  results receipt
  rf_comparison.py   RF's published figures beside ours
  sources.py         official statistics and other organisations' figures
                     (external_sources.json) shown beside the baseline
  calculator.py      household cases the dashboard calculator is tested against
  dashboard_data.py  compact results for the dashboard
analyses/            one folder per analysis (results and write-ups)
tests/               household-level reform tests and helper unit tests
```
