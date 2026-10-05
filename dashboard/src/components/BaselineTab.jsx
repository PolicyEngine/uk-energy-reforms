"use client";

import { useState } from "react";
import {
  DATASET_SHORT,
  PRICE_BASIS,
  getBaseline,
  getRfFigure,
  getSource,
  yearLabel,
} from "../lib/dataHelpers";
import {
  formatCurrency,
  formatGroup,
  formatMillions,
  formatShare,
} from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import ReportComparison from "./ReportComparison";
import SectionHeading from "./SectionHeading";
import OnThisTab from "./OnThisTab";
import { MetricCard, Note, SourceLink, Table, TableToggle, Toggle } from "./ui";

const BILL_GROUPS = [
  { value: "bill_by_decile", label: "Income decile" },
  { value: "bill_by_region", label: "Region" },
  { value: "bill_by_household_type", label: "Household type" },
  { value: "bill_by_tenure", label: "Tenure" },
];

// Each dataset's price level on Ofgem's 2023 typical-use basis, the only basis on which
// the 2024-25 caps are published.
const PRICE_LEVEL_SOURCE = {
  microcosm_national: ["ofgem_cap_fy2024_25", "mean"],
  efrs_1573: ["ofgem_cap_2026_apr_jun", "at_2023_tdcv"],
};

function sourceCell(source, text) {
  if (!source) return "n/a";
  return (
    <>
      <SourceLink href={source.url}>{text}</SourceLink>
      <span className="block text-xs text-slate-500">
        {source.publisher}, {source.period}, {source.geography}
      </span>
    </>
  );
}

export default function BaselineTab({ data, dataset }) {
  // The baseline is shown for the first scheme year only.
  const year = data.meta.years[0];
  const [groupBy, setGroupBy] = useState("bill_by_decile");
  const b = getBaseline(data, year, dataset);
  const replication = data.replication_2024?.rf_flat?.[dataset];
  const short = DATASET_SHORT[dataset];

  const src = (id) => getSource(data, id);
  const gbHouseholds = src("ons_households_gb_2025_sum_of_countries");
  const desnzHouseholds = src("desnz_households_gb_2024");
  const whd = src("whd_rebates_2025_26");
  const cap = src("ofgem_cap_2026_oct_dec");
  const elecWeekly = src("lcf_weekly_electricity_spend_fye2025");
  const gasWeekly = src("lcf_weekly_gas_spend_fye2025");
  const offGrid = src("desnz_off_gas_grid_share_gb_2024");
  const over10 = src("energy_cost_over_10pct_ahc_income_england_2025");
  const hbai = src("hbai_individuals_low_income_rates_fye2025");
  const hbaiKids = src("hbai_children_low_income_rates_fye2025");
  const hbaiPens = src("hbai_pensioners_low_income_rates_fye2025");
  const fuelPoverty = src("fuel_poverty_england_2025");
  const reported = getRfFigure(data, "passport_share_reported");
  const [levelId, levelKey] = PRICE_LEVEL_SOURCE[dataset] ?? [];
  const priceLevel = src(levelId)?.value?.[levelKey];
  const winterGap =
    priceLevel && cap ? cap.value.at_2023_tdcv / priceLevel - 1 : null;

  const povertyRate = (group, measure = "rel_pov_ahc") =>
    replication?.poverty?.find(
      (p) => p.measure === measure && p.group === group,
    )?.baseline_rate;

  const yl = yearLabel(data, year);
  const onGrid = 1 - (offGrid?.value ?? 0);
  const comparison = b
    ? [
        {
          key: "households",
          quantity: `Households in Great Britain (${yl})`,
          model: formatMillions(b.households_m, 2),
          external: (
            <>
              {sourceCell(
                gbHouseholds,
                `${formatMillions(gbHouseholds?.value?.gb_sum / 1e6, 2)} (ONS)`,
              )}
              {sourceCell(
                desnzHouseholds,
                `${formatMillions(desnzHouseholds?.value / 1e6, 1)} (DESNZ)`,
              )}
            </>
          ),
          notes:
            "ONS publishes UK and country totals; the GB figure is England, Wales and Scotland summed.",
        },
        {
          key: "passported",
          quantity: "Households receiving a passporting means-tested benefit",
          model: `${formatShare(b.passported_share)} modelled (${yl}); ${formatShare(
            reported?.policyengine?.[dataset]?.["2024"] ?? 0,
          )} reported (2024-25)`,
          external: (
            <>
              {sourceCell(
                whd,
                `${formatMillions(whd?.value?.households_gb_core_groups / 1e6, 2)} Warm Home Discount rebates (${formatShare(whd?.value?.share_of_gb_households, 1)})`,
              )}
              <span className="mt-1 block">
                around a quarter (Resolution Foundation, p. 1)
              </span>
            </>
          ),
          notes:
            "Modelled receipt applies PolicyEngine's take-up assumptions; reported receipt is what survey respondents report. Warm Home Discount rebates reach the named bill-payer where government data matching succeeds, and the count excludes Scotland's Broader Group (about 186,000 households), so it sits below the number of households receiving the benefits.",
        },
        {
          key: "bill",
          quantity: `Average annual gas and electricity bill (${yl}, at ${PRICE_BASIS[dataset]})`,
          model: formatCurrency(b.mean_bill),
          external: (
            <>
              {sourceCell(
                cap,
                `${formatCurrency(cap?.value?.at_2026_tdcv)} Ofgem cap, typical use`,
              )}
              {sourceCell(
                elecWeekly,
                `${formatCurrency(52 * ((elecWeekly?.value ?? 0) + (gasWeekly?.value ?? 0)))} ONS Family Spending (weekly × 52)`,
              )}
            </>
          ),
          notes: `The Ofgem figure is the October–December 2026 cap for typical consumption (2,500 kWh electricity, 9,500 kWh gas) paid by direct debit, with electricity VAT at 0% from October 2026 to March 2027. Family Spending averages all UK households in 2024-25. The model's spend is at ${PRICE_BASIS[dataset]}: policyengine-uk does not uprate energy spend between years, so every year keeps that price level${winterGap != null ? `, which the October–December 2026 cap exceeds by ${formatShare(winterGap)} on Ofgem's 2023 typical-use basis` : ""}.`,
        },
        {
          key: "gas",
          quantity: "Households with gas spend",
          model: formatShare(b.gas_spend_share),
          external: sourceCell(
            offGrid,
            `${formatShare(onGrid)} on the gas grid`,
          ),
          notes: `DESNZ estimates the share of domestic properties off the gas grid from meter counts. ${short} sits ${b.gas_spend_share < onGrid ? "below" : "above"} it.`,
        },
        {
          key: "burden",
          quantity: "Energy spend above 10% of income",
          model: formatShare(b.energy_over_10pct_share),
          external: sourceCell(
            over10,
            `${formatShare(over10?.value?.share, 1)} (England, 2025)`,
          ),
          notes: (
            <>
              Three different measures. The model divides actual spend by net
              income before housing costs. DESNZ&apos;s figure divides modelled
              required spend by income after housing costs, for England. The
              official fuel poverty measure for England, Low Income Low Energy
              Efficiency, also needs a low energy efficiency rating:{" "}
              {fuelPoverty ? (
                <SourceLink href={fuelPoverty.url}>
                  {formatShare(fuelPoverty.value.share, 1)} of households in{" "}
                  {fuelPoverty.period}
                </SourceLink>
              ) : (
                "see DESNZ"
              )}
              . The levels are not directly comparable.
            </>
          ),
        },
        // The headline's basis: absolute poverty before housing costs. In 2024-25,
        // the line's reference year, HBAI's absolute and relative rates coincide.
        ...[
          ["people", "All people", hbai],
          ["children", "Children", hbaiKids],
          ["pensioners", "Pensioners", hbaiPens],
        ].map(([group, label, source]) => ({
          key: `abs-pov-${group}`,
          quantity: `Absolute poverty before housing costs: ${label.toLowerCase()} (2024-25)`,
          model: formatShare(povertyRate(group, "abs_pov_bhc") ?? 0, 1),
          external: sourceCell(
            source,
            `${formatShare(source?.value?.absolute_bhc, 1)} (HBAI)`,
          ),
          notes:
            "Both use HBAI's line: 60% of the 2024-25 UK median, held constant in real terms. HBAI covers the UK, the model Great Britain. The number of people the discount moves above the line depends on how many sit just below it, so differences here carry over to that count.",
        })),
        ...[
          ["people", "All people", hbai],
          ["children", "Children", hbaiKids],
          ["pensioners", "Pensioners", hbaiPens],
        ].map(([group, label, source]) => ({
          key: `pov-${group}`,
          quantity: `Relative poverty after housing costs: ${label.toLowerCase()} (2024-25)`,
          model: formatShare(povertyRate(group) ?? 0, 1),
          external: sourceCell(
            source,
            `${formatShare(source?.value?.relative_ahc, 1)} (HBAI)`,
          ),
          notes:
            "HBAI counts people in the UK below 60% of the UK median. The model counts people in Great Britain below 60% of the UK median in its own data, so differences in the income distribution move both the line and the rate.",
        })),
      ]
    : [];

  const byDecile = groupBy === "bill_by_decile";
  const rows = (b?.[groupBy] ?? [])
    .map((r) => ({
      ...r,
      key: String(r.group),
      group: byDecile ? `Decile ${r.group}` : formatGroup(r.group),
    }))
    // Deciles keep their order; other groups are sorted from the highest bill down.
    .sort((x, y) => (byDecile ? 0 : y.mean_bill - x.mean_bill));
  const chartData = rows.map((r) => ({
    name: r.group,
    value: r.mean_bill,
    hoverText: `${formatCurrency(r.mean_bill)} a year on average; ${formatMillions(r.households_m, 2)} households`,
  }));

  return (
    <div className="space-y-6">
      <section
        id="baseline-headlines"
        className="section-card space-y-5 scroll-mt-24"
      >
        <SectionHeading
          title="The baseline"
          description={`The households, energy bills and benefit receipt the scheme acts on in ${yl}, before any discount. Further down, the model’s figures are checked against official statistics and against the Resolution Foundation’s own figures.`}
        />
        {b && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="GB households"
              icon="households"
              value={formatMillions(b.households_m, 2)}
              note={`${formatMillions(b.people_m)} people.`}
            />
            <MetricCard
              label="Average annual gas and electricity bill"
              icon="energy"
              value={formatCurrency(b.mean_bill)}
              note={`At ${PRICE_BASIS[dataset]}. Median ${formatCurrency(b.median_bill)}; electricity ${formatCurrency(b.mean_electricity)}, gas ${formatCurrency(b.mean_gas)}.`}
            />
            <MetricCard
              label="Passported by a benefit"
              icon="benefit"
              value={formatShare(b.passported_share)}
              note="Receive Universal Credit, Pension Credit, Housing Benefit, income-related ESA, income-based JSA or Income Support, as modelled."
            />
            <MetricCard
              label="Highest individual income below £24,000"
              icon="income"
              value={formatShare(b.income_test_share)}
              note="Share of households passing the income test, whether or not passported."
            />
          </div>
        )}
      </section>

      <div className="reading-layout">
        <div className="reading-body space-y-6">
          <section id="baseline-bills" className="section-card space-y-4">
            <SectionHeading
              title="How do energy bills vary?"
              description={`Average annual gas and electricity spend, by the group you choose. This affects the payment basis: a bill-share discount pays more to households with higher bills, while fixed amounts pay the same whatever the bill.${byDecile ? " Deciles rank people by household income after housing costs, adjusted for household size, from the lowest income (1) to the highest (10)." : ""}`}
            />
            <Toggle
              value={groupBy}
              onChange={setGroupBy}
              options={BILL_GROUPS}
            />
            <PEImpactBarChart
              data={chartData}
              horizontal
              yAxisLabel="Average annual gas and electricity bill"
              yTickFormatter={formatCurrency}
              barLabelFormatter={formatCurrency}
            />
            <ChartLogo />
            <div className="chart-footer">
              <TableToggle>
                <Table
                  minWidth={720}
                  columns={[
                    { key: "group", header: "Group" },
                    {
                      key: "households_m",
                      header: "Households",
                      align: "right",
                      format: (v) => formatMillions(v, 2),
                    },
                    {
                      key: "mean_bill",
                      header: "Gas and electricity",
                      align: "right",
                      format: formatCurrency,
                    },
                    {
                      key: "mean_electricity",
                      header: "Electricity",
                      align: "right",
                      format: formatCurrency,
                    },
                    {
                      key: "mean_gas",
                      header: "Gas",
                      align: "right",
                      format: formatCurrency,
                    },
                    {
                      key: "energy_over_10pct_share",
                      header: "Energy over 10% of income",
                      align: "right",
                      format: (v) => formatShare(v),
                    },
                  ]}
                  rows={rows}
                />
              </TableToggle>
            </div>
          </section>

          <div id="baseline-rf">
            <ReportComparison data={data} dataset={dataset} />
          </div>

          <section
            id="baseline-benchmarks"
            className="section-card space-y-4 scroll-mt-24"
          >
            <SectionHeading
              title="Comparison with official statistics and other organisations"
              description="Each row pairs a PolicyEngine figure with the nearest published figure, so you can judge how closely the model’s starting point matches the real population. Definitions differ row by row, and the notes flag each difference."
            />
            <TableToggle label="Show the comparison table">
              <ul className="benchmark-list">
                {comparison.map((row) => (
                  <li key={row.key} className="benchmark-row">
                    <p className="benchmark-quantity">{row.quantity}</p>
                    <div className="benchmark-values">
                      <div>
                        <p className="benchmark-label">PolicyEngine</p>
                        <p className="benchmark-model">{row.model}</p>
                      </div>
                      <div>
                        <p className="benchmark-label">Published</p>
                        <div className="text-sm leading-6">{row.external}</div>
                      </div>
                    </div>
                    <p className="benchmark-note">{row.notes}</p>
                  </li>
                ))}
              </ul>
            </TableToggle>
          </section>
        </div>
        <OnThisTab
          sections={[
            { id: "baseline-headlines", label: "At a glance" },
            { id: "baseline-bills", label: "Energy bills" },
            { id: "baseline-rf", label: "Resolution Foundation" },
            { id: "baseline-benchmarks", label: "Official benchmarks" },
          ]}
        />
      </div>
    </div>
  );
}

/** What the survey data record about energy; shown in the methodology. */
export function DataCoverage({ data, dataset }) {
  const b = getBaseline(data, data.meta.years[0], dataset);
  const short = DATASET_SHORT[dataset];
  const fuelPoverty = getSource(data, "fuel_poverty_england_2025");
  const over10 = getSource(data, "energy_cost_over_10pct_ahc_income_england_2025");
  const offGrid = getSource(data, "desnz_off_gas_grid_share_gb_2024");
  const onGrid = offGrid ? 1 - offGrid.value : null;
  return (
    <div className="space-y-3">
      <p>
        <strong>Data coverage.</strong> What the survey data record about energy
        spending, and what they omit. These gaps affect bill-share payments,
        which depend on each household’s recorded spend.
      </p>
      {b && (
        <Note eyebrow={short}>
          <p>{data.meta.datasets[dataset].label}.</p>
          <p className="mt-1">
            Energy spend is priced at {PRICE_BASIS[dataset]}; policyengine-uk
            does not uprate energy spend between years, so every year keeps that
            price level. {formatShare(b.gas_spend_share)} of GB households have
            gas spend
            {onGrid != null
              ? `, against the ${formatShare(onGrid)} of properties on the gas grid in DESNZ's meter counts,`
              : ""}{" "}
            and {formatShare(b.no_electricity_spend_share, 1)} have no
            electricity spend recorded; under a bill share, households with no
            recorded spend receive £0.
            {dataset === "efrs_1573"
              ? " The Enhanced FRS's gas share is well above DESNZ's, so its bill-share results are not comparable with Microcosm's."
              : ""}
          </p>
          <p className="mt-1">{data.meta.datasets[dataset].notes}</p>
        </Note>
      )}
      <p className="text-sm leading-6 text-slate-600">
        The data do not record prepayment meters, heating fuels off the gas
        grid, energy efficiency ratings or whether a household can afford to
        keep warm. The official fuel poverty measure for England, Low Income
        Low Energy Efficiency (
        {fuelPoverty ? (
          <SourceLink href={fuelPoverty.url}>
            {formatShare(fuelPoverty.value.share, 1)} of households in{" "}
            {fuelPoverty.period}
          </SourceLink>
        ) : (
          "DESNZ"
        )}
        ), needs energy efficiency ratings, so the model cannot reproduce it.
        DESNZ also reports the share of households in England whose modelled
        required energy spend exceeds 10% of income after housing costs (
        {over10 ? (
          <SourceLink href={over10.url}>
            {formatShare(over10.value.share, 1)} in 2025
          </SourceLink>
        ) : (
          "DESNZ"
        )}
        ). The model&apos;s &ldquo;energy spend above 10% of income&rdquo;
        divides actual spend by net income before housing costs, a third
        measure; the Baseline tab sets it beside DESNZ&apos;s.
      </p>
    </div>
  );
}
