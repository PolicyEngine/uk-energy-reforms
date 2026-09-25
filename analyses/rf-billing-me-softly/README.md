# Targeted energy discount: reach, cost and distribution

The Resolution Foundation's
[*Billing me softly*](https://www.resolutionfoundation.org/publications/billing-me-softly/)
(Brewer, Clegg and Marshall, 10 August 2026) proposes discounting gas and electricity unit
prices for households in Great Britain that either receive a means-tested benefit or have a
highest-income member whose taxable income is below £24,000 a year. It also sets out a
tiered version: about £220 below £18,000 and £85 from £18,000 to £24,000. This folder
estimates those options with PolicyEngine UK and sets the estimates beside the report's
own figures.

Key results for 2026-27, which runs from April 2026 to March 2027 and so contains the
January–March 2027 window the report proposes. Figures are Microcosm / Enhanced FRS; see
"Data" below. The Enhanced FRS weights sum to 30.7m GB households against 28.6m in
Microcosm and about 28m in the report, so its counts run 7-10% high; its shares and rates
are comparable.

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
- **Winners and inequality (flat option):** 40% / 37% of people in Great Britain live in a
  household that gains, from 82% / 85% in the lowest income decile to 5% / 2% in the highest.
  0.4% / 1.0% of people gain more than 5% of net income. Nobody loses, because the analysis
  does not model how the scheme is paid for. The Gini coefficient of equivalised household
  income falls by 0.0010 / 0.0011 before housing costs (0.3% on both) and by 0.0012 /
  0.0014 after housing costs.
- **2027-28 (the following winter):** the flat option costs £2.15bn / £2.26bn and reaches
  12.3m / 12.9m households (43% / 42%). The nominal £24,000 line covers fewer households as
  incomes rise: 35% / 37% pass the income test, down from 36% / 38%. Relative poverty after
  housing costs falls by 180k / 135k people. Poverty counts move by tens of thousands
  between years and datasets, because they depend on how many people sit just below the
  line.

## Replication of the report's figures

On 2024-25 incomes (the Family Resources Survey year the report analyses), PolicyEngine
estimates the following, set beside the Resolution Foundation's published figures:

| Figure | Resolution Foundation | Microcosm | Enhanced FRS |
|---|---|---|---|
| Households passported, modelled receipt with take-up (our basis) | around 25% (p. 1) | 27% | 26% |
| Households passported, reported receipt (RF's basis) | around 25% (p. 1) | 24% | 26% |
| Households whose highest individual income is below £24,000 | around 40% (p. 1) | 40% | 41% |
| Four lowest income deciles passing the £24,000 individual test | 75% (p. 6) | 73% | 77% |
| Households with equivalised household income below £30,000 | around 40% (p. 6) | 38% | 38% |
| Four lowest income deciles passing the £30,000 household test | 78% (p. 6) | 74% | 76% |
| Couples with children (benefit units) passing the household income test | 1.8m (p. 7) | 1.6m | 1.5m |
| …of which failing the individual income test (RF's basis) | 490,000 (p. 7) | 653,000 | 676,000 |
| …of which in the lowest income fifth (RF's basis) | 71% (p. 7) | 61% | 55% |
| …of which losing the discount, as not passported (policy count) | not published | 342,000 | 344,000 |
| …of which in the lowest income fifth (policy count) | not published | 77% | 65% |
| Pensioner units passing the individual test but not the household one (RF's basis) | 780,000 (p. 8) | 1,089,000 | 824,000 |
| …of which in decile five or above (RF's basis) | 81% (p. 8) | 71% | 60% |
| Pensioner units gaining the discount only under the individual option (policy count) | not published | 982,000 | 815,000 |
| …of which in decile five or above (policy count) | not published | 70% | 59% |
| Flat average of a £2bn scheme, over households passing the income test | £175 (p. 9) | £177 | £162 |
| Tiered amounts of a £2bn scheme, over households passing the income test | £220 / £85 (p. 9) | £211 / £82 | £191 / £74 |

How to read the table, and what explains the gaps:

- **Passporting basis.** Our passporting uses modelled receipt, including each dataset's
  take-up. RF uses receipt reported in the FRS. On reported receipt the shares are 24% /
  26%, either side of RF's "around a quarter"; modelled receipt puts Microcosm at 27%.
- **Family rows on two bases.** RF's p. 7-8 figures compare the two income-test series,
  and both of its figures show passporting as a separate series. So RF's 490,000 and
  780,000 are units that pass one income test and fail the other, whether or not they are
  passported. The "RF's basis" rows measure exactly that.
  - The "policy count" rows net out passporting, because a passported household is
    eligible under both options and loses or gains nothing. They count the units that
    actually lose or gain the discount. RF does not publish them.
  - On RF's basis, 653k / 676k couples with children fail the individual test, 33–38%
    above RF's 490,000. Netting out passporting halves that to 342k / 344k.
  - The pensioner rows barely move: 1,089k / 824k on RF's basis and 982k / 815k as a
    policy count, since few of these pensioners are passported.
  - Every row counts benefit units wherever they live, as RF's Figure 4 does. Counted as
    households with a single benefit unit, 1.4m / 1.4m couples pass the household test,
    536k / 584k fail the individual test (326k / 284k as a policy count), and 901k /
    810k pensioner households pass only the individual test (871k / 804k).
- **Decile basis.** Deciles are person-weighted AHC deciles, the HBAI convention. RF's
  footnote 6 names the income measure but not the weighting, so this is our choice.
  - With household-weighted deciles, 54% / 51% of the couples on RF's basis are in the
    lowest income fifth (69% / 62% as a policy count), against RF's 71%.
  - On the same basis, 76% / 69% of the pensioner units are in decile five or above (76%
    / 69% as a policy count), against RF's 81%.
- **Composition behind the pensioner row.** Microcosm's 1,089,000 exceeds the Enhanced
  FRS's 824,000, which is within 6% of RF's 780,000. The gap comes mainly from household
  composition, not the counting unit.
  - Multi-family households are 21% of Microcosm's households against 9% in the Enhanced
    FRS.
  - 17% of Microcosm's pensioner units on RF's basis live in one, against 2% in the
    Enhanced FRS. A pensioner living with an adult child in work passes the individual
    test and can fail the household one.
- **Small samples in the couples rows.** The lowest-income-fifth shares rest on few survey
  records and move between years. On the Enhanced FRS the policy-count share is 65% in
  2024-25 and 92% in 2026-27, on 440 and 356 records. `rf_comparison.json` records every
  row's sample size (`sample_n_*`).
- **Denominator for the £2bn averages.** Dividing £2bn among all eligible households
  (passported or passing the test) gives £151 / £146. The published £175 matches the
  income-test group.
- **Tier for passported households.** The report does not say which tier passported
  households receive in the tiered option.

`rf_comparison.md` lists every figure with 2026-27 values as well. Two statements are not
reproduced: the share of households unable to keep warm (the HBAI deprivation item is not in
the microdata), and the three-month income assessment (the microdata hold annual incomes).

## Baseline against published statistics

The dashboard's Baseline tab sets each model figure beside its nearest published figure,
with sources (`src/uk_energy_reforms/external_sources.json`).

- **Households.** 28.6m / 30.7m GB households in 2026-27 (28.3m / 30.3m in 2024-25). ONS
  counts 28.25m in 2025 (England, Wales and Scotland summed) and DESNZ uses 28.2m for 2024.
- **Passporting.** 27% / 26% of households on modelled receipt and 24% / 26% on reported
  receipt, against the report's "around a quarter". The Warm Home Discount paid 5.52m
  rebates in 2025-26 (18.6% of GB households). Rebates reach bill-payers matched through
  government data and the count excludes Scotland's Broader Group, so it sits below the
  number of households receiving the benefits.
- **Bills.** Microcosm averages £1,440 at 2024-25 prices, 19% below ONS Family Spending's
  £1,773 for the same year (UK, weekly spend × 52). Most of the gap is gas: £523 against
  £733, with electricity £917 against £1,040. The Enhanced FRS averages £1,586 at
  April–June 2026 unit rates, a price level within 2% of 2024-25's, so its higher average
  is consumption. Its median is £906, pulled down by the 14% of its households with no
  electricity spend. For comparison, Ofgem's typical-use cap is £1,477 for April–June 2026
  and £1,723 for October–December 2026.
- **Gas.** 75% / 95% of households have gas spend; DESNZ puts 84% of properties on the gas
  grid.
- **Relative poverty after housing costs, 2024-25.** 19.6% / 23.7% of people, against 19.6%
  in HBAI; children 26.7% / 32.9% against 27.4%; pensioners 16.2% / 17.5% against 13.9%.
  HBAI covers the UK; the model covers Great Britain against 60% of the UK median in its
  own data.

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
  such households in poverty, and 1.08m / 0.77m in the four lowest income deciles.
- **Couples without children:** 16% / 15% eligible. 599k / 757k of them are in the four
  lowest income deciles and unreached.

## The tiered option and income thresholds

- **Targeting at equal cost (£2bn).** The share of spending that reaches the four lowest income
  deciles is:
  - flat option: 71% / 78%;
  - tiered, with passported households in the top tier: 72% / 79%;
  - tiered, with passported households on their own income: 77% / 81%;
  - household-income test: 74% / 81%;
  - passporting alone: 65% / 74%. It reaches 43% / 46% of households in the four lowest income
    deciles, against 76% / 80% under the flat option.
- **Cliffs** (Microcosm only; the Enhanced FRS rests on an effective sample of about 10
  households within £1,000 of each line). Support falls to zero at £24,000, and in the
  tiered option it also drops by £135 at £18,000.
  - 410k non-passported households have tested income within £1,000 above £24,000. 200k
    of them are in the four lowest income deciles and 64k in relative poverty after housing
    costs (effective sample size 53).
  - 386k households sit within £1,000 above £18,000, and 318k (82%) of them are in the
    four lowest income deciles.
  - Households either side of a line look alike. On Microcosm, 44% of non-passported
    households within £1,000 below £24,000 are in the four lowest income deciles, against 49%
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
  - These shares are calibrated on bills at the datasets' stored price levels (2024-25 for
    Microcosm, April–June 2026 for the Enhanced FRS). On Ofgem's 2023 typical-use basis,
    the October–December 2026 cap is 15% above the first and 18% above the second. At this
    winter's prices the same shares would pay that much more than shown here; a scheme
    aiming at RF's averages would need about 11.7% rather than 13.5% in the flat option
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
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2027 \
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \
  --bill-share --budget 2e9 --out analyses/rf-billing-me-softly/results-2027
uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2024 \
  --presets rf_flat rf_tiered rf_household_income --out analyses/rf-billing-me-softly/results-2024
uv run uk-energy-reforms rf-compare --out analyses/rf-billing-me-softly
uv run uk-energy-reforms export-dashboard --analysis analyses/rf-billing-me-softly \
  --out dashboard/public/data/targeted_energy_discount_results.json \
  --calculator-out dashboard/public/data/calculator.json
```

- **Model.** Static microsimulation with policyengine-uk 2.100.1 for Great Britain.
  Northern Ireland is out of scope, as in the proposal.
- **Passporting.** Households qualify through the Warm Home Discount benefits as modelled,
  including take-up. The report uses receipt reported in the FRS instead; the replication
  table shows both.
- **Income test.** It uses `total_income`: earnings, pensions including the State Pension,
  property, savings, dividends and taxable benefits. Incomes are annual.
- **Nominal thresholds.** The £24,000, £18,000 and £30,000 thresholds are held at their
  nominal values while incomes are uprated from 2024-25. That is why the £24,000 test
  covers 40% / 41% of households on 2024-25 incomes, 36% / 38% in 2026-27 and 35% / 37% in
  2027-28.
- **Energy spend is not uprated.** policyengine-uk holds gas and electricity spend at the
  price level each dataset stores. [policyengine-uk#1860](https://github.com/PolicyEngine/policyengine-uk/pull/1860) added CPI uprating, and [policyengine-uk#1868](https://github.com/PolicyEngine/policyengine-uk/pull/1868)
  (merged 23 September) removed it again, because policyengine-uk-data already prices the
  Enhanced FRS at April–June 2026 unit rates.
  - Microcosm stores 2024-25 prices. Ofgem's cap for typical use averaged £1,678 over
    2024-25, 2% above its April–June 2026 level (£1,641, same consumption basis), so the
    two datasets sit at about the same price level. The gap between their average bills is
    consumption, not price.
  - Both sit below this winter's prices: the October–December 2026 cap is 17–18% above
    April–June 2026. Bill levels, bill-share payments and energy-burden shares are
    therefore understated in 2026-27 and 2027-28 on both datasets. Fixed amounts and
    eligibility do not depend on spend.
- **Take-up and income treatment.** Every eligible household claims. The discount counts as
  HBAI income, as DWP counts the Warm Home Discount.
- **Poverty lines.**
  - Relative poverty is 60% of the baseline UK median, held fixed for the reform.
  - Absolute poverty uses the 2010-11 HBAI line uprated by CPI.
  - Deciles rank GB people by equivalised income after housing costs.
- **Winners and inequality.** People are banded by their household's change in net income
  before housing costs relative to its baseline: above 5%, 0.1% to 5%, and within 0.1% (no
  change). Gini coefficients and top-10% and top-1% income shares use equivalised household
  net income, weighted by people in Great Britain; the record straddling a top-share
  cut-off counts in proportion to the weight inside it.
- **Receipts.** `results-2026/report.md`, `results-2027/report.md` and
  `results-2024/report.md` hold every table,
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
