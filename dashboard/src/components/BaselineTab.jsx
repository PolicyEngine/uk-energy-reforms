"use client";

import { useState } from "react";
import { DATASET_SHORT, getBaseline, getRfFigure, getSource, yearLabel } from "../lib/dataHelpers";
import { formatCurrency, formatGroup, formatMillions, formatShare } from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import ReportComparison from "./ReportComparison";
import SectionHeading from "./SectionHeading";
import { MetricCard, Note, SourceLink, Table, TableToggle, Toggle } from "./ui";

const BILL_GROUPS = [
  { value: "bill_by_decile", label: "Income decile" },
  { value: "bill_by_region", label: "Region" },
  { value: "bill_by_household_type", label: "Household type" },
  { value: "bill_by_tenure", label: "Tenure" },
];

const PRICE_BASIS = {
  microcosm_979: "2024-25 DESNZ prices",
  efrs_1573: "Ofgem April–June 2026 unit rates",
};

// Each dataset's price level on Ofgem's 2023 typical-use basis, the only basis on which
// the 2024-25 caps are published.
const PRICE_LEVEL_SOURCE = {
  microcosm_979: ["ofgem_cap_fy2024_25", "mean"],
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
  const [year, setYear] = useState(data.meta.years[0]);
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
  const winterGap = priceLevel && cap ? cap.value.at_2023_tdcv / priceLevel - 1 : null;

  const povertyRate = (group) =>
    replication?.poverty?.find((p) => p.measure === "rel_pov_ahc" && p.group === group)
      ?.baseline_rate;

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
              <span className="mt-1 block">around a quarter (Resolution Foundation, p. 1)</span>
            </>
          ),
          notes:
            "Modelled receipt applies PolicyEngine's take-up assumptions; reported receipt is what survey respondents report. Warm Home Discount rebates reach the named bill-payer where government data matching succeeds, and the count excludes Scotland's Broader Group (about 186,000 households), so it sits below the number of households receiving the benefits.",
        },
        {
          key: "bill",
          quantity: `Average annual gas and electricity bill (${yl})`,
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
          external: sourceCell(offGrid, `${formatShare(onGrid)} on the gas grid`),
          notes: `DESNZ estimates the share of domestic properties off the gas grid from meter counts. ${short} sits ${b.gas_spend_share < onGrid ? "below" : "above"} it.`,
        },
        {
          key: "burden",
          quantity: "Energy spend above 10% of income",
          model: formatShare(b.energy_over_10pct_share),
          external: sourceCell(over10, `${formatShare(over10?.value?.share, 1)} (England, 2025)`),
          notes:
            "The model divides actual spend by net income before housing costs; DESNZ divides modelled required spend by income after housing costs, for England. The bases differ, so the levels are not directly comparable.",
        },
        ...[
          ["people", "All people", hbai],
          ["children", "Children", hbaiKids],
          ["pensioners", "Pensioners", hbaiPens],
        ].map(([group, label, source]) => ({
          key: `pov-${group}`,
          quantity: `Relative poverty after housing costs: ${label.toLowerCase()} (2024-25)`,
          model: formatShare(povertyRate(group) ?? 0, 1),
          external: sourceCell(source, `${formatShare(source?.value?.relative_ahc, 1)} (HBAI)`),
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
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="The baseline"
          description="The households, energy bills and benefit receipt the scheme acts on, before any discount, and how the model's figures compare with official statistics and with the Resolution Foundation's own figures."
        />
      </div>

      <section className="section-card space-y-5">
        <Toggle
          label="Year"
          value={year}
          onChange={setYear}
          options={data.meta.years.map((y) => ({ value: y, label: yearLabel(data, y) }))}
        />
        {b && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="GB households"
              value={formatMillions(b.households_m, 2)}
              note={`${formatMillions(b.people_m)} people.`}
            />
            <MetricCard
              label="Average annual gas and electricity bill"
              value={formatCurrency(b.mean_bill)}
              note={`Median ${formatCurrency(b.median_bill)}; electricity ${formatCurrency(b.mean_electricity)}, gas ${formatCurrency(b.mean_gas)}.`}
            />
            <MetricCard
              label="Passported by a benefit"
              value={formatShare(b.passported_share)}
              note="Receive Universal Credit, Pension Credit, Housing Benefit, income-related ESA, income-based JSA or Income Support, as modelled."
            />
            <MetricCard
              label="Highest individual income below £24,000"
              value={formatShare(b.income_test_share)}
              note="Share of households passing the income test, whether or not passported."
            />
          </div>
        )}
      </section>

      <section className="section-card space-y-4">
        <SectionHeading
          title="Energy bills by group"
          description="Average annual gas and electricity spend. A unit-price discount pays more to households with higher bills; fixed amounts do not."
        />
        <Toggle value={groupBy} onChange={setGroupBy} options={BILL_GROUPS} />
        <PEImpactBarChart
          data={chartData}
          horizontal
          yAxisLabel="Average annual gas and electricity bill"
          yTickFormatter={formatCurrency}
          barLabelFormatter={formatCurrency}
        />
        <ChartLogo />
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
              { key: "mean_gas", header: "Gas", align: "right", format: formatCurrency },
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
      </section>

      <section className="section-card space-y-4">
        <SectionHeading
          title="Data coverage"
          description="What the data record about energy, and where they fall short."
        />
        {b && (
          <Note eyebrow={short}>
            <p>{data.meta.datasets[dataset].label}.</p>
            <p className="mt-1">
              Energy spend is priced at {PRICE_BASIS[dataset]}; policyengine-uk does not uprate
              energy spend between years, so every year keeps that price level.{" "}
              {formatShare(b.gas_spend_share)} of GB households have gas spend and{" "}
              {formatShare(b.no_electricity_spend_share, 1)} have no electricity spend recorded;
              under a bill share, households with no recorded spend get nothing.
            </p>
            <p className="mt-1">{data.meta.datasets[dataset].notes}</p>
          </Note>
        )}
        <p className="text-sm leading-6 text-slate-600">
          The data do not record prepayment meters, heating fuels off the gas grid, energy
          efficiency ratings or whether a household can afford to keep warm. The official fuel
          poverty measure for England (
          {fuelPoverty ? (
            <SourceLink href={fuelPoverty.url}>
              {formatShare(fuelPoverty.value.share, 1)} of households in {fuelPoverty.period}
            </SourceLink>
          ) : (
            "DESNZ"
          )}
          ) needs energy efficiency ratings, so the model cannot reproduce it.
        </p>
      </section>

      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="Comparison with official statistics and other organisations"
          description="Each row pairs a PolicyEngine figure with the nearest published figure. Definitions differ row by row, and the notes flag each difference."
        />
      </div>
      <section className="section-card">
        <Table
          minWidth={960}
          columns={[
            { key: "quantity", header: "Quantity" },
            { key: "model", header: "PolicyEngine" },
            { key: "external", header: "Published figure" },
            {
              key: "notes",
              header: "Notes",
              format: (v) => <span className="text-xs leading-5 text-slate-500">{v}</span>,
            },
          ]}
          rows={comparison}
        />
      </section>

      <ReportComparison data={data} dataset={dataset} />
    </div>
  );
}
