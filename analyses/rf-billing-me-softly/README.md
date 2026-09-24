# Targeted energy discount: reach, cost and distribution

The Resolution Foundation's
[*Billing me softly*](https://www.resolutionfoundation.org/publications/billing-me-softly/)
(Brewer, Clegg and Marshall, 10 August 2026) proposes discounting gas and electricity unit
prices for households in Great Britain that either receive a means-tested benefit or have a
highest-income member whose taxable income is below £24,000 a year. It also sets out a
tiered version: about £220 below £18,000 and £85 from £18,000 to £24,000. This folder
estimates those options with PolicyEngine UK and sets the estimates beside the report's
own figures.

Key results for 2026-27. Figures are Microcosm / Enhanced FRS; see "Data" below.

- **Flat option (£175 per eligible household):** costs £2.19bn / £2.29bn and reaches
  12.5m / 13.1m households (44% / 43% of GB households).
- **Tiered option at RF's amounts:** costs £2.48bn / £2.57bn, because every passported
  household receives the £220 tier.
- **Tiered, with passported households tiered on their own income:** costs £2.09bn /
  £2.31bn.
- **Poverty (flat option):** 150k / 207k fewer people in relative poverty after housing
  costs, of whom 20k / 75k are children and 77k / 31k pensioners.
- **Absolute poverty after housing costs:** the scheme reaches 86% / 89% of the 4.1m / 5.0m
  households below the line. It misses 0.56m in both datasets, almost all of them
  working-age.

## Replication of the report's figures

On 2024-25 incomes (the Family Resources Survey year the report analyses), PolicyEngine
estimates the following, set beside the Resolution Foundation's published figures:

| Figure | Resolution Foundation | Microcosm | Enhanced FRS |
|---|---|---|---|
| Households passported by means-tested benefits | around 25% (p. 1) | 27% | 26% |
| Households whose highest individual income is below £24,000 | around 40% (p. 1) | 40% | 41% |
| Poorest four deciles passing the £24,000 individual test | 75% (p. 6) | 73% | 77% |
| Households with equivalised household income below £30,000 | around 40% (p. 6) | 38% | 38% |
| Poorest four deciles passing the £30,000 household test | 78% (p. 6) | 74% | 76% |
| Couples with children eligible under the household test but not the individual test | 490,000 (p. 7) | 534,000 | 582,000 |
| Pensioner households eligible under the individual test but not the household test | 780,000 (p. 8) | 904,000 | 810,000 |
| Flat average of a £2bn scheme, over households passing the income test | £175 (p. 9) | £177 | £162 |
| Tiered amounts of a £2bn scheme, over households passing the income test | £220 / £85 (p. 9) | £211 / £82 | £191 / £74 |

Three differences in method explain the gaps:

- **Benefit units against households.** The report counts benefit units in its family-type
  figures. PolicyEngine counts single-benefit-unit households.
- **Denominator for the £2bn averages.** Dividing £2bn among all eligible households
  (passported or passing the test) gives £151 / £146. The published £175 matches the
  income-test group.
- **Tier for passported households.** The report does not say which tier passported
  households receive in the tiered option.

`rf_comparison.md` lists every figure with 2026-27 values as well. Two statements are not
reproduced: the share of households unable to keep warm (the HBAI deprivation item is not in
the microdata), and the three-month income assessment (the microdata hold annual incomes).

## By region (flat option)

- **Eligibility:**
  - Highest in the North West (50% / 48%), North East (49% / 52%) and West Midlands
    (50% / 44%).
  - Lowest in the South East (38% / 39%) and East of England (40% / 32%).
  - London (42% / 41%) combines the second-highest passporting rate (32% / 31%) with one
    of the lowest income-test pass rates (31% / 33%).
- **Gain relative to income:** 0.17–0.19% of average net income in the North, the Midlands,
  Wales and Scotland, against 0.11–0.12% in London and the South East.
- **Households in absolute poverty after housing costs that the scheme misses:**
  - London holds 198k / 107k and the South East 65k / 212k. Together they account for about
    half of the total, against 27% of households.
  - London reaches 75% / 84% of its households in poverty, against 92–98% in the North West,
    Yorkshire, Wales and Scotland.

## By household type (flat option)

Eligibility rates within household types agree across the two datasets; counts differ (see
"Data").

- **Lone parents:** 95% / 94% eligible, almost all through passporting.
- **Single pensioners:** 72% / 77% eligible, of whom about half qualify through the income
  test alone. They receive 23% / 24% of the spending.
- **Pensioner couples:** 41% / 37% eligible, 9% / 6% through passporting. Each partner's
  income is tested separately.
- **Couples with children:** 24% / 25% eligible. The scheme reaches 66% / 69% of those in
  absolute poverty after housing costs, the lowest share of any type. It misses 238k / 183k
  such households in poverty, and 1.07m / 0.77m in the poorest four deciles.
- **Couples without children:** 16% / 15% eligible. 599k / 757k of them are in the poorest
  four deciles and unreached.

## The tiered option and income thresholds

- **Targeting at equal cost (£2bn).** The share of spending that reaches the poorest four
  deciles is:
  - flat option: 71% / 78%;
  - tiered, with passported households in the top tier: 72% / 79%;
  - tiered, with passported households on their own income: 77% / 81%;
  - household-income test: 74% / 81%;
  - passporting alone: 65% / 74%. It reaches 43% / 46% of households in the poorest four
    deciles, against 76% / 80% under the flat option.
- **Cliffs.** Support falls to zero at £24,000, and in the tiered option it also drops by
  £135 at £18,000.
  - 410k non-passported households have tested income within £1,000 above £24,000. 200k /
    270k of them are in the poorest four deciles.
  - 386k / 333k households sit within £1,000 above £18,000, and 82–84% of them are in the
    poorest four deciles.
  - Households either side of a line look alike. On Microcosm, 44% of non-passported
    households within £1,000 below £24,000 are in the poorest four deciles, against 49%
    within £1,000 above.
- **Dead zones.** A basic-rate employee in these ranges would need more extra gross pay than
  the support lost to break even:
  - flat option: 52k / 58k households at £24,000;
  - tiered option: 68k / 92k at £18,000 plus 26k at £24,000.
- **Unit-rate delivery,** the report's mechanism, keeps each tier's average but pays in
  proportion to gas and electricity bills (Microcosm, flat option).
  - Single adults average £124 and couples with children £253.
  - Dead zones roughly double, because households with high bills lose more at the line.

## Method

Commands, from the repository root:

```bash
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2026 \
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \
  --unit-rate --budget 2e9 --out analyses/rf-billing-me-softly/results-2026
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2024 \
  --presets rf_flat rf_tiered rf_household_income --out analyses/rf-billing-me-softly/results-2024
uv run uk-energy-reforms rf-compare --out analyses/rf-billing-me-softly
```

- **Model.** Static microsimulation with policyengine-uk 2.100.1 for Great Britain.
  Northern Ireland is out of scope, as in the proposal.
- **Passporting.** Households qualify through the Warm Home Discount benefits as modelled,
  including take-up.
- **Income test.** It uses `total_income`: earnings, pensions including the State Pension,
  property, savings, dividends and taxable benefits. Incomes are annual.
- **Take-up and income treatment.** Every eligible household claims. The discount counts as
  HBAI income, as DWP counts the Warm Home Discount.
- **Poverty lines.**
  - Relative poverty is 60% of the baseline UK median, held fixed for the reform.
  - Absolute poverty uses the 2010-11 HBAI line uprated by CPI.
  - Deciles rank GB people by equivalised income after housing costs.
- **Receipts.** `results-2026/report.md` and `results-2024/report.md` hold every table,
  including effective sample sizes. `results.json` holds the raw numbers.

## Data

- **Microcosm.** The staged Microcosm UK 2024-25 national dataset
  (`policyengine/populace-uk-private`, attempt
  `uk-frs-calibration-attempt-20260923T134002Z-c1be1c9f`). This is a candidate build, not a
  certified release. Its energy spend is priced with DESNZ Quarterly Energy Prices, raked to
  NEED and levelled to Energy Trends.
  - Its gas-connected share (75% of GB households) is below the DESNZ meter share (84%).
- **Enhanced FRS.** Enhanced FRS 2024-25 from policyengine-uk-data 1.57.3. Its energy spend
  is imputed from the LCFS and raked to NEED 2023.
  - 14% of its GB households have no electricity spend.
  - Its weights are concentrated: the Kish effective sample size is about 1,100, and 207
    records carry 10m households. Treat its regional, household-type and band estimates as
    indicative, and set aside its unit-rate results.
- **Household-type weights differ between the datasets.** Multi-family households are 21%
  of households in Microcosm and 9% in the Enhanced FRS, from the same survey records.
- **What neither dataset records:** prepayment meters, off-grid heating fuels, energy
  efficiency ratings or whether a household can afford to keep warm.
