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

- **Flat option (£175 per eligible household):** costs £2.09bn / £2.29bn and reaches
  12.0m / 13.1m households (42% / 43% of GB households).
- **Tiered option at RF's amounts:** costs £2.38bn / £2.57bn, because every passported
  household receives the £220 tier.
- **Tiered, with passported households tiered on their own income:** costs £2.00bn /
  £2.31bn.
- **Poverty (flat option):** 227k / 207k fewer people in relative poverty after housing
  costs, of whom 36k / 75k are children and 122k / 31k pensioners.
- **Absolute poverty after housing costs:** the scheme reaches 87% / 87% of the 4.7m / 6.3m
  households below the line. It does not reach 0.63m / 0.80m, almost all of them
  working-age. Before housing costs it reaches 93% / 94% of the 3.9m / 5.2m households below
  the line and does not reach 0.27m / 0.31m.
- **Winners and inequality (flat option):** 38% / 37% of people in Great Britain live in a
  household that gains, from 84% / 85% in the lowest income decile to 3% / 2% in the highest.
  0.3% / 1.0% of people gain more than 5% of net income. Nobody loses, because the analysis
  does not model how the scheme is paid for. The Gini coefficient of equivalised household
  income falls by 0.0009 / 0.0011 before housing costs (0.3% on both) and by 0.0011 /
  0.0014 after housing costs.
- **2027-28 (the following winter):** the flat option costs £2.04bn / £2.26bn and reaches
  11.7m / 12.9m households (41% / 42%). The nominal £24,000 line covers fewer households as
  incomes rise: 33% / 37% pass the income test, down from 35% / 38%. Relative poverty after
  housing costs falls by 231k / 135k people. Poverty counts move by tens of thousands
  between years and datasets, because they depend on how many people sit just below the
  line.

## Replication of the report's figures

On 2024-25 incomes (the Family Resources Survey year the report analyses), PolicyEngine
estimates the following, set beside the Resolution Foundation's published figures:

| Figure | Resolution Foundation | Microcosm | Enhanced FRS |
|---|---|---|---|
| Households passported, modelled receipt with take-up (our basis) | around 25% (p. 1) | 26% | 26% |
| Households passported, reported receipt (RF's basis) | around 25% (p. 1) | 24% | 26% |
| Households whose highest individual income is below £24,000 | around 40% (p. 1) | 38% | 41% |
| Four lowest income deciles passing the £24,000 individual test | 75% (p. 6) | 71% | 77% |
| Households with equivalised household income below £30,000 | around 40% (p. 6) | 36% | 38% |
| Four lowest income deciles passing the £30,000 household test | 78% (p. 6) | 72% | 76% |
| Couples with children (benefit units) passing the household income test | 1.8m (p. 7) | 1.4m | 1.5m |
| …of which not passing the individual income test (RF's basis) | 490,000 (p. 7) | 588,000 | 676,000 |
| …of which in the lowest income fifth (RF's basis) | 71% (p. 7) | 66% | 55% |
| …of which not eligible under the individual option, as not passported (policy count) | not published | 296,000 | 344,000 |
| …of which in the lowest income fifth (policy count) | not published | 75% | 65% |
| Pensioner units passing the individual test but not the household one (RF's basis) | 780,000 (p. 8) | 930,000 | 824,000 |
| …of which in decile five or above (RF's basis) | 81% (p. 8) | 67% | 60% |
| Pensioner units eligible only under the individual option (policy count) | not published | 878,000 | 815,000 |
| …of which in decile five or above (policy count) | not published | 68% | 59% |
| Flat average of a £2bn scheme, over households passing the income test | £175 (p. 9) | £185 | £162 |
| Tiered amounts of a £2bn scheme, over households passing the income test | £220 / £85 (p. 9) | £220 / £85 | £191 / £74 |

How to read the table, and what explains the gaps:

- **Passporting basis.** Our passporting uses modelled receipt, including each dataset's
  take-up. RF uses receipt reported in the FRS. On reported receipt the shares are 24% /
  26%, either side of RF's "around a quarter"; modelled receipt puts both datasets at 26%.
- **Family rows on two bases.** RF's p. 7-8 figures compare the two income-test series,
  and both of its figures show passporting as a separate series. So RF's 490,000 and
  780,000 are units that pass one income test and not the other, whether or not they are
  passported. The "RF's basis" rows measure exactly that.
  - The "policy count" rows net out passporting, because a passported household is
    eligible under both options. They count the units eligible under only one of the two
    options. RF does not publish them.
  - On RF's basis, 588k / 676k couples with children do not pass the individual test,
    20–38% above RF's 490,000. Netting out passporting halves that to 296k / 344k.
  - The pensioner rows move less: 930k / 824k on RF's basis and 878k / 815k as a
    policy count, because 6% / 1% of these pensioner units are passported.
  - Every row counts benefit units wherever they live, as RF's Figure 4 does. Counted as
    households with a single benefit unit, 1.2m / 1.4m couples pass the household test,
    498k / 584k do not pass the individual test (288k / 284k as a policy count), and 829k /
    810k pensioner households pass only the individual test (804k / 804k).
- **Decile basis.** Deciles are person-weighted AHC deciles, the HBAI convention. RF's
  footnote 6 names the income measure but not the weighting, so this is our choice.
  - With household-weighted deciles, 59% / 51% of the couples on RF's basis are in the
    lowest income fifth (68% / 62% as a policy count), against RF's 71%.
  - On the same basis, 68% / 69% of the pensioner units are in decile five or above (70%
    / 69% as a policy count), against RF's 81%.
- **Composition behind the pensioner row.** Microcosm's 930,000 exceeds the Enhanced
  FRS's 824,000, which is within 6% of RF's 780,000. The gap comes mainly from household
  composition, not the counting unit.
  - Multi-family households are 21% of Microcosm's households against 9% in the Enhanced
    FRS.
  - 11% of Microcosm's pensioner units on RF's basis live in one, against 2% in the
    Enhanced FRS. A pensioner living with an adult child in work passes the individual
    test and may not pass the household one.
- **Small samples in the couples rows.** The lowest-income-fifth shares rest on a few
  hundred survey records and move between years. On the Enhanced FRS the policy-count
  share is 65% in 2024-25 and 92% in 2026-27, on 440 and 356 records.
  `rf_comparison.json` records every row's sample size (`sample_n_*`).
- **Denominator for the £2bn averages.** Dividing £2bn among all eligible households
  (passported or passing the test) gives £160 / £146. The published £175 is closer to the
  income-test group (£185 / £162), and on Microcosm the tiered amounts over that group
  match RF's £220 / £85.
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
- **Passporting.** 26% of households on modelled receipt in both datasets and 24% / 26% on
  reported receipt, against the report's "around a quarter". The Warm Home Discount paid 5.52m
  rebates in 2025-26 (18.6% of GB households). Rebates reach bill-payers matched through
  government data and the count excludes Scotland's Broader Group, so it sits below the
  number of households receiving the benefits.
- **Bills.** Microcosm averages £1,437 at 2024-25 prices, 19% below ONS Family Spending's
  £1,773 for the same year (UK, weekly spend × 52). Gas accounts for £210 of the £336 gap:
  £523 against £733, with electricity £915 against £1,040. The Enhanced FRS averages £1,586 at
  April–June 2026 unit rates, a price level within 2% of 2024-25's, so its higher average
  is consumption. Its median is £906, pulled down by the 14% of its households with no
  electricity spend. For comparison, Ofgem's typical-use cap is £1,477 for April–June 2026
  and £1,723 for October–December 2026.
- **Gas.** 79% / 95% of households have gas spend; DESNZ puts 84% of properties on the gas
  grid.
- **Relative poverty after housing costs, 2024-25.** 18.6% / 23.7% of people, against 19.6%
  in HBAI; children 24.7% / 32.9% against 27.4%; pensioners 16.0% / 17.5% against 13.9%.
  HBAI covers the UK; the model covers Great Britain against 60% of the UK median in its
  own data.

## By region (flat option)

- **Eligibility:**
  - Highest in the North East (55% / 52%), West Midlands (48% / 44%) and Wales (47% /
    50%).
  - Lowest in London (35% / 41%), the South East (36% / 39%) and East of England (36% /
    32%).
  - London combines one of the highest passporting rates (30% / 31%) with one of the
    lowest income-test pass rates (27% / 33%).
- **Gain relative to income:** 0.16–0.22% of average net income in the North, the Midlands,
  Wales and Scotland, against 0.08–0.10% in London and the South East (Microcosm).
- **Households in absolute poverty after housing costs that the scheme does not reach:**
  - London holds 148k / 116k and the South East 86k / 243k. Together they account for 37%
    / 45% of the total, against 27% of households.
  - London reaches 79% / 86% of its households in poverty. On Microcosm that is the lowest
    of any region, against 93–94% in the North East, Wales and Scotland; on the Enhanced
    FRS the South East is lowest (76%).

## By household type (flat option)

Eligibility rates within household types differ by 1 to 19 percentage points between the
two datasets; counts differ as well (see "Data").

- **Lone parents:** 92% / 94% eligible, almost all through passporting.
- **Single pensioners:** 63% / 77% eligible, of whom 45% / 49% qualify through the income
  test alone. They receive 21% / 24% of the spending.
- **Pensioner couples:** 44% / 35% eligible, 7% / 6% through passporting. Each partner's
  income is tested separately.
- **Couples with children:** 22% / 26% eligible. The scheme reaches 67% / 64% of those in
  absolute poverty after housing costs, the lowest share of any type. It does not reach
  277k / 303k such households in poverty, and 1.17m / 0.77m in the four lowest income
  deciles.
- **Couples without children:** 16% / 15% eligible. 578k / 757k of them are in the four
  lowest income deciles and unreached.

## Eligibility across income measures (flat option)

The income test looks at one person's taxable income. To see which households that reaches
or leaves out, households are ranked by five wider measures of household income before the
discount:

- equivalised household net income, before and after housing costs, using the modified
  OECD scale policyengine-uk shares with DWP's HBAI;
- the same net income without the size adjustment;
- household taxable income, summed over members.

Each decile holds a tenth of GB households, because eligibility and payment are per
household. Figures are 2026-27, Microcosm / Enhanced FRS.

- **Eligibility across the distribution.** On equivalised income before housing costs,
  eligibility falls from 96% / 97% of households in the lowest decile to 4% / 3% in the
  highest. The lowest three deciles receive 61% / 62% of spending and the top half 16% /
  15%.
- **Households in the lowest three deciles that do not qualify:** 1.26m / 1.01m, or 15% /
  11% of those deciles.
  - They include 1.23m / 0.96m children, and 47% / 67% of them are in relative poverty after
    housing costs.
  - Couples with children are the largest group (45% / 44%).
  - In 75% / 69% of them two or more members have taxable income, and the highest earner
    averages £33,700 / £36,300, above the line.
  - After housing costs the group is 1.58m / 1.38m (18% / 15% of the lowest three deciles).
  - Counted the HBAI way, with deciles of people rather than households, 1.57m / 1.28m
    households in the lowest three deciles do not qualify, holding 22% / 19% of the people
    in them.
- **Households in the top half that qualify through the income test alone:**
  - 0.10m / 0.21m households: 2% / 4% of those qualifying through the income test alone,
    and 0.9% / 2% of spending.
  - About half are pensioner couples (51%, Microcosm).
  - 48% / 43% have two or more members with taxable income above £12,570.
  - These figures rest on effective samples of 23 / 5.
- **Households in the top half that qualify through passporting:**
  - 1.83m / 1.74m households: 24% / 22% of passported households, and 15% / 13% of
    spending.
  - On Microcosm, 45% are multi-family households. There, one benefit unit's Universal
    Credit, Pension Credit or Housing Benefit passports a household whose combined taxable
    income averages £57,700.
  - On the Enhanced FRS the group is mostly single pensioners and single adults, and rests
    on an effective sample of 27. The difference follows the datasets' share of
    multi-family households (21% / 9%).
- **Removing the size adjustment changes the ranking.**
  - Ranked by household net income without the size adjustment, the households left out in
    the lowest three deciles are mostly single adults and single pensioners (76% / 77%) with
    one income (81% / 83%). A single earner just above £24,000 sits in the lower deciles of
    household income, but not once household size is counted.
  - Ranked by household taxable income, 0.35m households (4%) / none in the lowest three
    deciles are left out. That follows from the rule: if combined taxable income
    is below £24,000, every member's is too. On Microcosm the third decile reaches up to
    £26,800, so the 0.35m are households with combined taxable income between £24,000 and
    £26,800, including single earners just over the line (an effective sample of 61). On
    the Enhanced FRS the third decile stops at £23,000.
- **Other rules, on equivalised income before housing costs.**
  - The household-income test leaves out more households in the lowest three deciles
    (1.70m / 1.20m, against 1.26m / 1.01m).
  - It reduces top-half households qualifying through the income test to 0.03m / 0.04m
    (from 0.10m / 0.21m).
  - Passporting alone leaves out 4.82m / 4.91m, or 56% / 53% of the lowest three deciles.

The dashboard section "Explore eligibility across income measures" shows who qualifies by
decile on every measure. The cross-tabulations of equivalised against unequivalised
income and the make-up of each group are in the receipts and `results.json`, not on the
dashboard.

## The tiered option and income thresholds

- **Targeting at equal cost (£2bn).** The share of spending that reaches the four lowest income
  deciles is:
  - flat option: 74% / 78%;
  - tiered, with passported households in the top tier: 74% / 79%;
  - tiered, with passported households on their own income: 78% / 81%;
  - household-income test: 76% / 81%;
  - passporting alone: 68% / 74%. It reaches 44% / 46% of households in the four lowest income
    deciles, against 76% / 80% under the flat option.
- **Cliffs** (Microcosm only; the Enhanced FRS rests on an effective sample of about 10
  households within £1,000 of each line). Support falls to zero at £24,000, and in the
  tiered option it also drops by £135 at £18,000. The counts below and the offset range are
  in the receipts' "Income cut-offs" section, which the dashboard's Economic impact tab
  links to; the household tab shows where support changes for one household as its income
  changes.
  - 278k non-passported households have tested income within £1,000 above £24,000. 120k
    of them are in the four lowest income deciles and 62k in relative poverty after housing
    costs (effective sample size 57).
  - 371k households sit within £1,000 above £18,000, and 299k (81%) of them are in the
    four lowest income deciles.
  - On Microcosm, 67% of non-passported households within £1,000 below £24,000 are in the
    four lowest income deciles, against 43% within £1,000 above. Each band rests on an
    effective sample of about 55.
- **Offset range** (Microcosm). Just above a line, a household's extra income after tax is
  smaller than the support it no longer receives. The offset range is the band of tested
  income over which that holds: the support lost grossed up at the top earner's marginal
  rate of 28% (basic-rate tax plus 8% employee NI), or 20% where the top earner is over
  State Pension age and pays no NI. For £175 of support it is £243 wide, or £219 for a
  pensioner. Households in that band:
  - flat option: 64k households at £24,000;
  - tiered option: 45k at £18,000 plus 32k at £24,000.
- **Bill-share delivery.** The report proposes a cut in unit prices (pence per kWh). The
  microdata hold annual gas and electricity spend, not kWh, so the closest model is a
  percentage off the annual bill.
  - That also discounts standing charges and gives low-consumption households relatively
    more than a per-kWh cut would.
  - Matching the fixed amounts' averages takes 13.1% off the annual bill in the flat
    option, and 16.4% (below £18,000) and 6.6% (£18,000 to £24,000) in the tiered option
    (Microcosm).
  - These shares are calibrated on bills at the datasets' stored price levels (2024-25 for
    Microcosm, April–June 2026 for the Enhanced FRS). On Ofgem's 2023 typical-use basis,
    the October–December 2026 cap is 15% above the first and 18% above the second. At this
    winter's prices the same shares would pay that much more than shown here; a scheme
    aiming at RF's averages would need about 11.4% rather than 13.1% in the flat option
    (Microcosm).
  - Support then follows bills: single adults average £141 and couples with children £235
    (Microcosm, flat option).
  - Households in the offset range rise from 64k to 68k, because households with high bills
    receive more below the line.
  - Brackets paying the same fixed amount share one rate, so averages match across those
    brackets combined, not within each. On the Enhanced FRS the two flat brackets average
    £169 and £281.

## Method

Commands, from the repository root:

```bash
uv run uk-energy-reforms run --datasets microcosm_national efrs_1573 --year 2026 \
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \
  --bill-share --budget 2e9 --out analyses/rf-billing-me-softly/results-2026
uv run uk-energy-reforms run --datasets microcosm_national efrs_1573 --year 2027 \
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \
  --bill-share --budget 2e9 --out analyses/rf-billing-me-softly/results-2027
uv run uk-energy-reforms run --datasets microcosm_national efrs_1573 --year 2024 \
  --presets rf_flat rf_tiered rf_household_income --out analyses/rf-billing-me-softly/results-2024
uv run uk-energy-reforms rf-compare --out analyses/rf-billing-me-softly
uv run uk-energy-reforms export-dashboard --analysis analyses/rf-billing-me-softly \
  --out dashboard/public/data/targeted_energy_discount_results.json \
  --calculator-out dashboard/public/data/calculator.json
```

- **Model.** Static microsimulation with policyengine-uk 2.102.3 for Great Britain.
  Northern Ireland is out of scope, as in the proposal.
- **Passporting.** Households qualify through the Warm Home Discount benefits as modelled,
  including take-up. The report uses receipt reported in the FRS instead; the replication
  table shows both. Any Pension Credit award passports, including the Savings Credit alone
  (about 151,000 claimants in March 2026): RF's footnote 2 lists Pension Credit without
  distinction, and the Warm Home Discount's low-income group has taken Savings Credit
  awards since its 2025-26 expansion.
- **Income test.** It uses `total_income`: earnings, pensions including the State Pension,
  property, savings, dividends and taxable benefits. Incomes are annual.
- **Nominal thresholds.** The £24,000, £18,000 and £30,000 thresholds are held at their
  nominal values while incomes are uprated from 2024-25. That is why the £24,000 test
  covers 38% / 41% of households on 2024-25 incomes, 35% / 38% in 2026-27 and 33% / 37% in
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
  - Absolute poverty uses the line HBAI has used since March 2026: 60% of the 2024-25
    median, held constant in real terms. That is £431.69 a week before housing costs and
    £373.89 after, for a couple without children, in 2024-25. policyengine-uk uprates it
    by CPI, to £456.63 and £395.49 in 2026-27. Results before policyengine-uk 2.102.3
    used the 2010-11 line uprated by CPI, which HBAI no longer applies from 2021-22.
  - Deciles rank GB people by equivalised income after housing costs.
- **Winners and inequality.** People are banded by their household's change in net income
  before housing costs relative to its baseline: above 5%, 0.1% to 5%, and within 0.1% (no
  change). Gini coefficients and top-10% and top-1% income shares use equivalised household
  net income, weighted by people in Great Britain; the record straddling a top-share
  cut-off counts in proportion to the weight inside it.
- **Income measures.** Households are ranked by baseline (pre-discount) income.
  - Equivalised HBAI net income is divided by the modified OECD scale:
    - before housing costs: 0.67 for the first adult, 0.33 for each other adult and each
      child aged 14 to 17, and 0.2 for each younger child;
    - after housing costs: 0.58, 0.42 and 0.2.
  - Household taxable income sums members' `total_income`.
  - Deciles are household-weighted, and tied incomes share a decile.
  - The three groups are:
    - households in deciles 1–3 that neither are passported nor pass the income test;
    - households in deciles 6–10 that qualify through the income test alone;
    - households in deciles 6–10 that qualify through passporting.
  - Means are withheld below an effective sample of 30. Cross-tabulation cells and groups
    with fewer than 10 survey records are blanked. `analysis.income_distributions` writes
    every figure, including the lowest-three-decile group on deciles of people.
- **Receipts.** `results-2026/report.md`, `results-2027/report.md` and
  `results-2024/report.md` hold every table,
  including effective sample sizes. `results.json` holds the raw numbers.

## Data

- **Microcosm.** The Microcosm UK 2024-25 national release, published on 4 October 2026
  (`policyengine/populace-uk-private`, release `microcosm-uk-2024-25-national`, cut
  `microcosm-uk-2024-25-national-20261002T230158Z-5c6b3f68`). It is a certified release,
  built with policyengine-uk 2.100.0, and replaces the staged national attempt
  (`uk-frs-calibration-attempt-20260923T134002Z-c1be1c9f`) that earlier versions of this
  analysis used. Its energy spend is priced with DESNZ Quarterly Energy Prices, raked to
  NEED and levelled to Energy Trends.
  - Its gas-connected share (79% of GB households) is below the DESNZ meter share (84%).
- **Enhanced FRS.** Enhanced FRS 2024-25 from policyengine-uk-data 1.57.3. Its energy spend
  is imputed from the LCFS and raked to NEED 2023.
  - 14% of its GB households have no electricity spend.
  - Its weights are highly concentrated: the Kish effective sample size is about 1,100, 2%
    of its 47,000 GB records, and 207 records carry 10m households. Treat its regional,
    household-type and band estimates as indicative, and set aside its bill-share results.
  - Its weights sum to 30.7m GB households in 2026-27, 7% above Microcosm and 10% above
    the report's 28m, so every Enhanced FRS count (recipients, households in poverty,
    people moved out of poverty) runs high by about that much.
- **Household-type weights differ between the datasets.** Multi-family households are 21%
  of households in Microcosm and 9% in the Enhanced FRS, from the same survey records.
  Microcosm's share lifts its counts of groups that live with other benefit units, such as
  pensioners living with adult children (see the pensioner row in the replication table).
- **What neither dataset records:** prepayment meters, off-grid heating fuels, energy
  efficiency ratings or whether a household can afford to keep warm.
