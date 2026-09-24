# Targeted energy discount: reach, cost and distribution

The Resolution Foundation's
[*Billing me softly*](https://www.resolutionfoundation.org/publications/billing-me-softly/)
(Brewer, Clegg and Marshall, 10 August 2026) proposes discounting gas and electricity unit
prices for households in Great Britain that either receive a means-tested benefit or have a
highest-income member whose taxable income is below £24,000 a year. It also sets out a
tiered version: about £220 below £18,000 and £85 from £18,000 to £24,000. This folder
estimates those options with PolicyEngine UK and sets the estimates beside the report's
own figures.

Key results for 2026-27. Figures are Microcosm / Enhanced FRS; see "Data" below. The
Enhanced FRS weights sum to 30.7m GB households against 28.6m in Microcosm and about 28m
in the report, so its counts run 7-10% high; its shares and rates are comparable.

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
| Households passported, modelled receipt with take-up (our basis) | around 25% (p. 1) | 27% | 26% |
| Households passported, reported receipt (RF's basis) | around 25% (p. 1) | 24% | 26% |
| Households whose highest individual income is below £24,000 | around 40% (p. 1) | 40% | 41% |
| Poorest four deciles passing the £24,000 individual test | 75% (p. 6) | 73% | 77% |
| Households with equivalised household income below £30,000 | around 40% (p. 6) | 38% | 38% |
| Poorest four deciles passing the £30,000 household test | 78% (p. 6) | 74% | 76% |
| Couples with children (benefit units) passing the household test | 1.8m (p. 7) | 1.6m | 1.5m |
| …of which not eligible under the individual option | 490,000 (p. 7) | 342,000 | 344,000 |
| …of which in the poorest fifth | 71% (p. 7) | 77% | 65% |
| Pensioner units eligible only under the individual option | 780,000 (p. 8) | 982,000 | 815,000 |
| …of which in decile five or above | 81% (p. 8) | 70% | 59% |
| Flat average of a £2bn scheme, over households passing the income test | £175 (p. 9) | £177 | £162 |
| Tiered amounts of a £2bn scheme, over households passing the income test | £220 / £85 (p. 9) | £211 / £82 | £191 / £74 |

How to read the table, and what explains the gaps:

- **Passporting basis.** Our passporting uses modelled receipt, including each dataset's
  take-up. RF uses receipt reported in the FRS. On reported receipt the shares are 24% /
  26%, either side of RF's "around a quarter"; modelled receipt puts Microcosm at 27%.
- **Family rows are policy counts.** A unit counts as losing (or gaining) only if its
  household is eligible under one option and not the other. Passported households are
  eligible under both, so they are excluded.
  - Netting out passporting takes the couples who lose from 653k / 676k to 342k / 344k,
    now about 30% below RF's 490,000.
  - The rows count benefit units wherever they live, as RF's Figure 4 does. Counted as
    households with a single benefit unit they read 1.4m / 1.4m couples passing the
    household test, 326k / 284k losing and 871k / 804k pensioner households gaining.
- **Decile basis.** Deciles are person-weighted AHC deciles, the HBAI convention. RF's
  footnote 6 names the income measure but not the weighting, so this is our choice.
  - With household-weighted deciles instead, 69% / 62% of the couples who lose are in the
    poorest fifth, against RF's 71%.
  - On the same basis, 76% / 69% of the pensioner units who gain are in decile five or
    above, against RF's 81%.
- **Composition behind the pensioner row.** Microcosm's 982,000 exceeds the Enhanced FRS's
  815,000, which is within 5% of RF's 780,000. The gap comes mainly from household
  composition, not the counting unit.
  - Multi-family households are 21% of Microcosm's households against 9% in the Enhanced
    FRS.
  - 11% of Microcosm's gaining pensioner units live in one, against 1% in the Enhanced FRS.
    A pensioner living with an adult child in work passes the individual test and can
    fail the household one.
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
- **Pensioner couples:** 41% / 35% eligible, 9% / 6% through passporting. Each partner's
  income is tested separately.
- **Couples with children:** 24% / 26% eligible. The scheme reaches 67% / 69% of those in
  absolute poverty after housing costs, the lowest share of any type. It misses 239k / 183k
  such households in poverty, and 1.08m / 0.77m in the poorest four deciles.
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
- **Cliffs** (Microcosm only; the Enhanced FRS rests on an effective sample of about 10
  households within £1,000 of each line). Support falls to zero at £24,000, and in the
  tiered option it also drops by £135 at £18,000.
  - 410k non-passported households have tested income within £1,000 above £24,000. 200k
    of them are in the poorest four deciles and 64k in relative poverty after housing
    costs (effective sample size 53).
  - 386k households sit within £1,000 above £18,000, and 318k (82%) of them are in the
    poorest four deciles.
  - Households either side of a line look alike. On Microcosm, 44% of non-passported
    households within £1,000 below £24,000 are in the poorest four deciles, against 49%
    within £1,000 above.
- **Dead zones** (Microcosm). These are households whose top earner would need more extra
  gross pay than the support lost to break even. The marginal rate is 28% (basic-rate tax
  plus 8% employee NI), or 20% where the top earner is over State Pension age and pays no
  NI; a pensioner's zone is £219 wide rather than £243 for £175 of support.
  - flat option: 50k households at £24,000;
  - tiered option: 64k at £18,000 plus 26k at £24,000.
- **Bill-share delivery.** The report proposes a cut in unit prices (pence per kWh). The
  microdata hold annual gas and electricity spend, not kWh, so the closest model is a
  percentage off the annual bill.
  - That also discounts standing charges and gives low-consumption households relatively
    more than a per-kWh cut would.
  - Matching the fixed amounts' averages takes 13.5% off the annual bill in the flat
    option, and 17.1% (below £18,000) and 6.4% (£18,000 to £24,000) in the tiered option
    (Microcosm).
  - Support then follows bills: single adults average £124 and couples with children £252
    (Microcosm, flat option).
  - Dead zones rise from 50k to 85k, because households with high bills lose more at the
    line.
  - Brackets paying the same fixed amount share one rate, so averages match across those
    brackets combined, not within each. On the Enhanced FRS the two flat brackets average
    £169 and £281.

## Method

Commands, from the repository root:

```bash
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2026 \
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \
  --bill-share --budget 2e9 --out analyses/rf-billing-me-softly/results-2026
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2024 \
  --presets rf_flat rf_tiered rf_household_income --out analyses/rf-billing-me-softly/results-2024
uv run uk-energy-reforms rf-compare --out analyses/rf-billing-me-softly
```

- **Model.** Static microsimulation with policyengine-uk 2.100.1 for Great Britain.
  Northern Ireland is out of scope, as in the proposal.
- **Passporting.** Households qualify through the Warm Home Discount benefits as modelled,
  including take-up. The report uses receipt reported in the FRS instead; the replication
  table shows both.
- **Income test.** It uses `total_income`: earnings, pensions including the State Pension,
  property, savings, dividends and taxable benefits. Incomes are annual.
- **Nominal thresholds.** The £24,000, £18,000 and £30,000 thresholds are held at their
  nominal values while incomes are uprated from 2024-25 to 2026-27. That is why the
  £24,000 test covers 40% / 41% of households on 2024-25 incomes but 36% / 38% in 2026-27.
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
    indicative, and set aside its bill-share results.
  - Its weights sum to 30.7m GB households in 2026-27, 7% above Microcosm and 10% above
    the report's 28m, so every Enhanced FRS count (recipients, households in poverty,
    people moved out of poverty) runs high by about that much.
- **Household-type weights differ between the datasets.** Multi-family households are 21%
  of households in Microcosm and 9% in the Enhanced FRS, from the same survey records.
  Microcosm's share lifts its counts of groups that live with other benefit units, such as
  pensioners living with adult children (see the pensioner row in the replication table).
- **What neither dataset records:** prepayment meters, off-grid heating fuels, energy
  efficiency ratings or whether a household can afford to keep warm.
