"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { colors } from "../lib/colors";
import {
  DATASET_ORDER,
  DATASET_SHORT,
  getBaseline,
  getRfFigure,
  getSource,
  yearLabel,
} from "../lib/dataHelpers";
import { formatCurrency, formatGroup, formatMillions, formatShare } from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import SectionHeading from "./SectionHeading";
import { MetricCard, Note, SourceLink, Table, Toggle } from "./ui";

const AXIS_STYLE = { fontSize: 12, fill: colors.gray[500] };

const BILL_GROUPS = [
  { value: "bill_by_decile", label: "Income decile" },
  { value: "bill_by_region", label: "Region" },
  { value: "bill_by_household_type", label: "Household type" },
  { value: "bill_by_tenure", label: "Tenure" },
];

const PRICE_BASIS = {
  microcosm_979:
    "priced at 2024-25 DESNZ energy prices; policyengine-uk 2.100 does not uprate energy spend between years, so later years keep 2024-25 price levels",
  efrs_1573:
    "stored at Ofgem April–June 2026 unit rates, so every year carries 2026-27 price levels",
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

function modelCells(datasets, fn) {
  return datasets.map((d) => fn(d)).join(" / ");
}

export default function BaselineTab({ data }) {
  const [year, setYear] = useState(data.meta.years[0]);
  const [groupBy, setGroupBy] = useState("bill_by_decile");
  const [dataset, setDataset] = useState(DATASET_ORDER[0]);
  const datasets = DATASET_ORDER.filter((d) => data.meta.datasets[d]);
  const base = (d, y = year) => getBaseline(data, y, d);
  const replication = (d) => data.replication_2024?.rf_flat?.[d];
  const b = base(dataset);

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

  const povertyRate = (d, measure, group) =>
    replication(d)?.poverty?.find((p) => p.measure === measure && p.group === group)?.baseline_rate;

  const yl = yearLabel(data, year);
  const comparison = [
    {
      key: "households",
      quantity: `Households in Great Britain (${yl})`,
      model: modelCells(datasets, (d) => formatMillions(base(d).households_m, 2)),
      external: (
        <>
          {sourceCell(gbHouseholds, `${formatMillions(gbHouseholds?.value?.gb_sum / 1e6, 2)} (ONS)`)}
          {sourceCell(desnzHouseholds, `${formatMillions(desnzHouseholds?.value / 1e6, 1)} (DESNZ)`)}
        </>
      ),
      notes:
        "ONS publishes UK and country totals; the GB figure is England, Wales and Scotland summed. Enhanced FRS weights sum to more households than either, so its counts run high.",
    },
    {
      key: "passported",
      quantity: "Households receiving a passporting means-tested benefit",
      model: `${modelCells(datasets, (d) => formatShare(base(d).passported_share))} modelled (${yl}); ${modelCells(datasets, (d) => formatShare(reported?.policyengine?.[d]?.["2024"] ?? 0))} reported (2024-25)`,
      external: (
        <>
          {sourceCell(whd, `${formatMillions(whd?.value?.households_gb_core_groups / 1e6, 2)} Warm Home Discount rebates (${formatShare(whd?.value?.share_of_gb_households, 1)})`)}
          <span className="mt-1 block">around a quarter (Resolution Foundation, p. 1)</span>
        </>
      ),
      notes:
        "Modelled receipt applies PolicyEngine's take-up assumptions; reported receipt is what survey respondents report. Warm Home Discount rebates reach the named bill-payer where government data matching succeeds, and the count excludes Scotland's Broader Group (about 186,000 households), so it sits below the number of households receiving the benefits.",
    },
    {
      key: "bill",
      quantity: `Average annual gas and electricity bill (${yl})`,
      model: modelCells(datasets, (d) => formatCurrency(base(d).mean_bill)),
      external: (
        <>
          {sourceCell(cap, `${formatCurrency(cap?.value?.at_2026_tdcv)} Ofgem cap, typical use`)}
          {sourceCell(
            elecWeekly,
            `${formatCurrency(52 * ((elecWeekly?.value ?? 0) + (gasWeekly?.value ?? 0)))} ONS Family Spending (weekly × 52)`,
          )}
        </>
      ),
      notes: `The Ofgem figure is the October–December 2026 cap for typical consumption (2,500 kWh electricity, 9,500 kWh gas) paid by direct debit, with electricity VAT at 0% from October 2026 to March 2027; Family Spending averages all UK households in 2024-25, when prices were lower. Microcosm is ${PRICE_BASIS.microcosm_979}; the Enhanced FRS is ${PRICE_BASIS.efrs_1573}.`,
    },
    {
      key: "gas",
      quantity: "Households with gas spend",
      model: modelCells(datasets, (d) => formatShare(base(d).gas_spend_share)),
      external: sourceCell(offGrid, `${formatShare(1 - (offGrid?.value ?? 0))} on the gas grid`),
      notes:
        "DESNZ puts 16% of domestic properties off the gas grid. Microcosm sits below it and the Enhanced FRS above it.",
    },
    {
      key: "burden",
      quantity: "Energy spend above 10% of income",
      model: modelCells(datasets, (d) => formatShare(base(d).energy_over_10pct_share)),
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
      model: modelCells(datasets, (d) => formatShare(povertyRate(d, "rel_pov_ahc", group) ?? 0, 1)),
      external: sourceCell(source, `${formatShare(source?.value?.relative_ahc, 1)} (HBAI)`),
      notes:
        "HBAI counts people in the UK below 60% of the UK median. The model counts people in Great Britain below 60% of the UK median in its own data, so differences in the income distribution move both the line and the rate.",
    })),
  ];

  const rows = (b?.[groupBy] ?? []).map((r) => ({
    ...r,
    key: String(r.group),
    group: groupBy === "bill_by_decile" ? `Decile ${r.group}` : formatGroup(r.group),
  }));

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="The baseline"
          description="The households, energy bills and benefit receipt the scheme acts on, before any discount, and how the model's figures compare with official statistics and other organisations."
        />
      </div>

      <section className="section-card space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            label="Year"
            value={year}
            onChange={setYear}
            options={data.meta.years.map((y) => ({ value: y, label: yearLabel(data, y) }))}
          />
          <Toggle
            label="Data"
            value={dataset}
            onChange={setDataset}
            options={datasets.map((d) => ({ value: d, label: DATASET_SHORT[d] }))}
          />
        </div>
        {b && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="GB households" value={formatMillions(b.households_m, 2)} note={`${formatMillions(b.people_m)} people.`} />
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
        <div className="h-[340px] w-full">
          <ResponsiveContainer>
            <BarChart data={rows} margin={{ top: 20, right: 20, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
              <XAxis
                dataKey="group"
                tick={AXIS_STYLE}
                interval={0}
                angle={rows.length > 6 && groupBy !== "bill_by_decile" ? -30 : 0}
                textAnchor={rows.length > 6 && groupBy !== "bill_by_decile" ? "end" : "middle"}
                height={rows.length > 6 && groupBy !== "bill_by_decile" ? 80 : 30}
              />
              <YAxis tick={AXIS_STYLE} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => [formatCurrency(v), "Average annual bill"]} />
              <Bar dataKey="mean_bill" name="Average annual bill" fill={colors.primary[600]} radius={[6, 6, 0, 0]}>
                <LabelList dataKey="mean_bill" position="top" formatter={formatCurrency} style={{ fontSize: 11, fill: colors.gray[700] }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartLogo />
        <Table
          minWidth={720}
          columns={[
            { key: "group", header: "Group" },
            { key: "households_m", header: "Households", align: "right", format: (v) => formatMillions(v, 2) },
            { key: "mean_bill", header: "Gas and electricity", align: "right", format: formatCurrency },
            { key: "mean_electricity", header: "Electricity", align: "right", format: formatCurrency },
            { key: "mean_gas", header: "Gas", align: "right", format: formatCurrency },
            { key: "energy_over_10pct_share", header: "Energy over 10% of income", align: "right", format: (v) => formatShare(v) },
          ]}
          rows={rows}
        />
      </section>

      <section className="section-card space-y-4">
        <SectionHeading
          title="Data coverage"
          description="What each dataset records about energy, and where it falls short."
        />
        <div className="grid gap-4 md:grid-cols-2">
          {datasets.map((d) => {
            const x = base(d);
            return (
              <Note key={d} eyebrow={DATASET_SHORT[d]}>
                <p>{data.meta.datasets[d].label}.</p>
                <p className="mt-1">
                  Energy spend is {PRICE_BASIS[d]}. {formatShare(x.gas_spend_share)} of GB
                  households have gas spend and {formatShare(x.no_electricity_spend_share, 1)} have
                  no electricity spend recorded; under a bill share, households with no recorded
                  spend get nothing.
                </p>
                <p className="mt-1">{data.meta.datasets[d].notes}</p>
              </Note>
            );
          })}
        </div>
        <p className="text-sm leading-6 text-slate-600">
          Neither dataset records prepayment meters, heating fuels off the gas grid, energy
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
          description="Each row pairs a model figure (Microcosm / Enhanced FRS) with the nearest published figure. Definitions differ row by row, and the notes flag each difference."
        />
      </div>
      <section className="section-card">
        <Table
          minWidth={960}
          columns={[
            { key: "quantity", header: "Quantity" },
            { key: "model", header: "This model (Microcosm / Enhanced FRS)" },
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
    </div>
  );
}
