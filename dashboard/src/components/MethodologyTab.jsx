"use client";

import { DATASET_ORDER, DATASET_SHORT, getResult, yearLabel } from "../lib/dataHelpers";
import { formatCurrency, formatShare } from "../lib/formatters";
import SectionHeading from "./SectionHeading";
import { Note, SourceLink } from "./ui";

const REPO = "https://github.com/PolicyEngine/uk-energy-reforms";

function Section({ title, children }) {
  return (
    <section className="section-card space-y-3">
      <SectionHeading title={title} />
      <div className="space-y-3 text-sm leading-6 text-slate-700">{children}</div>
    </section>
  );
}

function Bullets({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function MethodologyTab({ data }) {
  const years = data.meta.years;
  const firstYear = years[0];
  const datasets = DATASET_ORDER.filter((d) => data.meta.datasets[d]);
  const flatScaled = getResult(data, firstYear, "rf_flat", "budget_2bn", "microcosm_979")?.schedule
    ?.amounts?.[0];
  const cap = (id) => (data.external_sources ?? []).find((x) => x.id === id);
  const capFy24 = cap("ofgem_cap_fy2024_25");
  const capQ2 = cap("ofgem_cap_2026_apr_jun");
  const capQ4 = cap("ofgem_cap_2026_oct_dec");

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="Methodology"
          description={
            <>
              How the options are modelled, what the figures measure and what they leave out.
              The reform code, the analysis and every published figure are in{" "}
              <SourceLink href={REPO}>PolicyEngine/uk-energy-reforms</SourceLink>.
            </>
          }
        />
      </div>

      <Section title="The proposal as modelled">
        <p>
          The Resolution Foundation proposes a discount on gas and electricity unit prices for
          households in Great Britain that either receive a means-tested benefit or whose
          highest-income member has taxable income below £24,000. It sizes the scheme at about
          £2bn, which it puts at an average of £175 per eligible household, and sets out a tiered
          version paying about £220 below £18,000 and £85 from £18,000 to £24,000. The model adds
          a discount per household to the household&apos;s income for the year; nothing else in
          the tax and benefit system changes. Two comparators sit beside the flat and tiered
          options: the report&apos;s household-income test, and passporting alone, as the Warm
          Home Discount does.
        </p>
        <p>
          The Resolution Foundation publishes average amounts, not the pay-out rule itself, so
          each option can be run with three sets of amounts, chosen with the &ldquo;Support
          amounts&rdquo; buttons:
        </p>
        <Bullets
          items={[
            <>
              <strong>RF&apos;s amounts</strong> pay the report&apos;s averages as fixed sums:
              £175 per household in the flat option, and £220 or £85 in the tiered one. The cost
              is whatever those amounts add up to on our data, which is not exactly £2bn.
            </>,
            <>
              <strong>Scaled to £2bn</strong> keeps the same shape but scales every amount by
              one factor so the scheme costs exactly £2bn in Great Britain. On Microcosm in{" "}
              {yearLabel(data, firstYear)} the flat option then pays{" "}
              {flatScaled ? formatCurrency(flatScaled) : "n/a"} per household. The factor
              depends on the dataset and year.
            </>,
            <>
              <strong>Bill share</strong> pays a percentage of each household&apos;s annual gas
              and electricity spend instead of a fixed sum, with the percentage set so the
              average payment matches RF&apos;s amounts. It is the nearest the data allow to the
              report&apos;s cut in unit prices, because the data record spend, not kilowatt-hours.
              Spend includes standing charges, so a bill share gives low-use households more
              than a per-kWh cut would.
            </>,
          ]}
        />
      </Section>

      <Section title="Who is eligible">
        <Bullets
          items={[
            <>
              <strong>Passporting.</strong> A household is passported if anyone in it receives
              Universal Credit, Pension Credit, Housing Benefit, income-related Employment and
              Support Allowance, income-based Jobseeker&apos;s Allowance or Income Support (the
              Warm Home Discount list, RF footnote 2). The main results use receipt as
              PolicyEngine models it, with its take-up assumptions; the report&apos;s comparison
              also shows receipt as survey respondents report it, which is the Resolution
              Foundation&apos;s basis.
            </>,
            <>
              <strong>Income test.</strong> Each adult&apos;s taxable income is PolicyEngine&apos;s
              total income: earnings, private and State Pensions, property, savings and dividend
              income and taxable benefits (RF footnote 5). The household passes if its
              highest-income member is below the line. The comparator option instead divides
              total household taxable income by the modified OECD equivalence scale (first adult
              0.67, other adults and children 14 and over 0.33, younger children 0.2) and tests
              it against £30,000.
            </>,
            <>
              <strong>Tiers.</strong> The report does not say which tier passported households
              get. The tiered option gives them the top tier (£220) whatever their income; the
              own-income variant places them by their own income instead, with £85 as the floor.
            </>,
            <>
              <strong>Great Britain only.</strong> Northern Ireland bills sit outside the Ofgem
              price cap (RF footnote 1), so Northern Irish households are excluded throughout,
              and all totals and shares are for Great Britain.
            </>,
            <>
              <strong>Annual income.</strong> The proposal would test income over the three
              months before the scheme starts; the data record annual income, so the model tests
              that. Households with volatile incomes may qualify in one and not the other.
            </>,
            <>
              <strong>Nominal thresholds.</strong> The £18,000, £24,000 and £30,000 lines are
              not uprated between years, so as incomes grow, fewer households pass the income test
              in 2027-28 than in 2026-27.
            </>,
            <>
              <strong>Full take-up.</strong> Passported households are enrolled automatically.
              Households qualifying through the income test would have to apply (RF p. 10); the
              model assumes all of them do, so reach and cost are upper bounds for that group.
            </>,
          ]}
        />
      </Section>

      <Section title="How impacts are measured">
        <Bullets
          items={[
            <>
              <strong>Income.</strong> The discount is added to household net income, before and
              after housing costs. DWP counts the Warm Home Discount, a bill credit paid through
              suppliers, as household income in Households Below Average Income, and the model
              does the same for this discount.
            </>,
            <>
              <strong>Static, unfunded.</strong> Nobody changes their behaviour: energy use,
              work and benefit claims stay as they are. The cost is not offset by any tax rise
              or spending cut, so every change in income is a gain.
            </>,
            <>
              <strong>Income deciles.</strong> People in Great Britain are ranked by equivalised
              household income after housing costs before the reform, as in the report&apos;s
              Figure 3, and split into ten groups of equal population.
            </>,
            <>
              <strong>Winners and losers.</strong> Each person is placed in a band by the change
              in their household&apos;s net income before housing costs, as a share of that income
              before the reform:
              gains above 5%, gains of 0.1% to 5%, and no change (within 0.1%). An unfunded
              discount creates no losers.
            </>,
            <>
              <strong>Inequality.</strong> Gini coefficients and the shares of income held by the
              top 10% and top 1%, on equivalised household net income before and after housing
              costs, weighted by people, for Great Britain.
            </>,
            <>
              <strong>Poverty.</strong> Absolute poverty uses PolicyEngine&apos;s fixed line
              (the 2010-11 HBAI line uprated by CPI). Relative poverty uses 60% of the UK median
              equivalised income before the reform, held fixed so the discount moves people
              across the line without also moving the line.
            </>,
            <>
              <strong>Energy burden.</strong> A household spends more than 10% of its net income
              before housing costs on gas and electricity. This is the old fuel poverty test on
              actual spend, not the official Low Income Low Energy Efficiency measure, which needs
              energy efficiency ratings the data do not have.
            </>,
            <>
              <strong>Cut-offs.</strong> A household just above a threshold loses the support
              below it. The dead zone is the range above the line where the household is worse
              off than one just below it: the support lost, grossed up at 28% (basic-rate tax and
              employee National Insurance), or 20% where the highest earner is over State Pension
              age. Counts in narrow income bands rest on few survey records, and the tab flags
              bands with an effective sample below 30.
            </>,
          ]}
        />
      </Section>

      <Section title="Years and data">
        <Bullets
          items={[
            <>
              <strong>Years.</strong> PolicyEngine models fiscal years.{" "}
              {yearLabel(data, "2026")} runs from April 2026 to March 2027 and contains January to
              March 2027, the winter the report proposes the discount for; it is the main year.
              {years.includes("2027") ? (
                <>
                  {" "}
                  {yearLabel(data, "2027")} (April 2027 to March 2028) shows the scheme if it ran
                  the following winter.
                </>
              ) : null}{" "}
              Like-for-like comparisons with the report use 2024-25, the year of its survey.
            </>,
            <>
              <strong>Uprating.</strong> Incomes, benefits and taxes are projected from the
              2024-25 survey year with policyengine-uk {data.meta.policyengine_uk}&apos;s
              forecasts. Gas and electricity spend is not uprated between years: policyengine-uk
              holds it at the price level each dataset stores, April–June 2026 unit rates for the
              Enhanced FRS and 2024-25 prices for Microcosm. Those two price levels are close:
              Ofgem&apos;s cap for typical use averaged{" "}
              {capFy24 ? formatCurrency(capFy24.value.mean) : "n/a"} over 2024-25 against{" "}
              {capQ2 ? formatCurrency(capQ2.value.at_2023_tdcv) : "n/a"} in April–June 2026. So
              the gap between the datasets&apos; average bills comes from consumption, not price.
              Both sit below this winter&apos;s prices: the October–December 2026 cap is{" "}
              {capQ2 && capQ4
                ? formatShare(capQ4.value.at_2026_tdcv / capQ2.value.at_2026_tdcv - 1)
                : "n/a"}{" "}
              above April–June 2026. Bill levels, bill-share payments and energy-burden shares are
              therefore understated in the scheme years on both datasets. Fixed amounts and
              eligibility do not depend on spend.
            </>,
            ...datasets.map((d) => (
              <>
                <strong>{DATASET_SHORT[d]}.</strong> {data.meta.datasets[d].label}.{" "}
                {data.meta.datasets[d].notes}
              </>
            )),
            <>
              Where the two datasets disagree, neither is taken as right. Microcosm&apos;s
              household count sits closer to official totals and its weights are far less
              concentrated, so the charts open on it; every figure can be switched to the
              Enhanced FRS.
            </>,
          ]}
        />
      </Section>

      <Section title="What the model leaves out">
        <Bullets
          items={[
            "Prepayment meters, standing-charge structures and the per-kWh form of the discount: the data hold annual spend only.",
            "Heating oil, LPG and other fuels off the gas grid, which the discount would not cover.",
            "Households that share a meter, such as houses in multiple occupation, and households whose bills are included in rent.",
            "Delivery through suppliers, administration costs, error and fraud.",
            "Behavioural responses: extra energy use when prices fall, or changes in work to stay below the income line.",
          ]}
        />
      </Section>

      <Section title="Reproduce the results">
        <p>
          Every figure on this page is pre-computed. The{" "}
          <SourceLink href={REPO}>repository</SourceLink> holds the reform (as a policyengine-uk
          parameter tree and variables), the analysis code, the published outputs and the
          Resolution Foundation&apos;s figures with page references. The survey microdata are
          licensed and are not in the repository.
        </p>
        <Note eyebrow="Commands">
          <code className="block whitespace-pre-wrap text-xs">
            {`uv run uk-energy-reforms run --datasets microcosm_979 efrs_1573 --year 2026 \\
  --presets rf_flat rf_tiered rf_tiered_own_income rf_household_income passport_only \\
  --bill-share --budget 2e9 --out analyses/rf-billing-me-softly/results-2026
uv run uk-energy-reforms rf-compare --out analyses/rf-billing-me-softly
uv run uk-energy-reforms export-dashboard --analysis analyses/rf-billing-me-softly \\
  --out dashboard/public/data/targeted_energy_discount_results.json \\
  --calculator-out dashboard/public/data/calculator.json`}
          </code>
        </Note>
      </Section>
    </div>
  );
}
