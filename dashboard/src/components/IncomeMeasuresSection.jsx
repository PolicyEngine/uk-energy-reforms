"use client";

import { useState } from "react";
import { series } from "../lib/colors";
import { getDistributions, yearLabel } from "../lib/dataHelpers";
import {
  BASIS_OPTIONS,
  MEASURE_NAMES,
  MEASURE_OPTIONS,
  boundLabel,
  distributionKey,
  groupLabel,
} from "../lib/distributions";
import { formatCurrency, formatMillions, formatShare } from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import SectionHeading from "./SectionHeading";
import { Legend, Note, SplitBar, Table, TableToggle, Toggle } from "./ui";

const DECILE_METRICS = [
  {
    value: "cost_share",
    label: "Share of spending",
    axis: "Share of spending",
    format: (v) => formatShare(v, 1),
  },
  {
    value: "average_gain",
    label: "Average gain (£)",
    axis: "Average gain per household",
    format: (v) => formatCurrency(v),
  },
];

const SEGMENTS = [
  { key: "passported", label: "Passported by a means-tested benefit", color: series.a },
  { key: "income_only", label: "Qualifies through the income test alone", color: series.b },
  { key: "not_eligible", label: "Does not qualify", color: series.neutral },
];

export default function IncomeMeasuresSection({ data, dataset, year, preset, variant }) {
  const [measure, setMeasure] = useState("eq");
  const [basis, setBasis] = useState("bhc");
  const [decileMetric, setDecileMetric] = useState("cost_share");

  const block = getDistributions(data, year, preset, dataset);
  if (!block) {
    return (
      <section className="section-card text-sm text-slate-500">
        Eligibility across income measures is not available for this option and year.
      </section>
    );
  }
  const key = distributionKey(measure, basis);
  const dist = block.distributions[key];
  const cuts = dist.cut_points;
  const m = DECILE_METRICS.find((x) => x.value === decileMetric);
  const basisLabel = BASIS_OPTIONS.find((b) => b.value === basis).label.toLowerCase();
  const measureName =
    measure === "taxable" ? MEASURE_NAMES.taxable : `${MEASURE_NAMES[measure]} ${basisLabel}`;

  return (
    <>
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="Eligibility across income measures"
          description="The income test looks at the highest taxable income of anyone in the household. These charts rank households by three wider measures of household income instead, to show which households the rules reach, and which they do not, across each distribution."
        />
      </div>

      <section className="section-card space-y-4">
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            label="Income measure"
            value={measure}
            onChange={setMeasure}
            options={MEASURE_OPTIONS}
          />
          {measure !== "taxable" && (
            <Toggle
              label="Housing costs"
              value={basis}
              onChange={setBasis}
              options={BASIS_OPTIONS}
            />
          )}
        </div>
        <Note eyebrow="How the measures differ">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Equivalised household income</strong> is household net income adjusted for
              household size with the modified OECD scale PolicyEngine and DWP use: the first adult
              counts 0.67 (0.58 after housing costs), each other adult and each child aged 14 or
              over 0.33 (0.42), each younger child 0.2. It is expressed for a childless couple, so a
              single adult on £20,000 counts as about £29,900.
            </li>
            <li>
              <strong>Household net income</strong> is the same income before that adjustment:
              earnings, pensions and benefits after taxes, for the whole household.
            </li>
            <li>
              <strong>Household taxable income</strong> adds up the taxable income of everyone in
              the household, the income the test uses for one person. It leaves out untaxed benefits
              such as Universal Credit, Pension Credit, Housing Benefit and Child Benefit, and has
              no after-housing-costs version.
            </li>
            <li>
              Deciles here hold a tenth of GB households each, ranked by income before the discount,
              so they differ from the decile charts above, which hold a tenth of people.
            </li>
          </ul>
        </Note>
        {variant !== "published" && (
          <p className="text-xs leading-5 text-slate-500">
            Who qualifies does not depend on the amounts, so this section uses the option&apos;s
            eligibility with RF&apos;s amounts for spending and gains.
          </p>
        )}
      </section>

      <section className="section-card space-y-4">
        <SectionHeading
          title="Who qualifies across the income distribution"
          description={`Each row is a tenth of GB households, ranked by ${measureName}, split by how they qualify, ${yearLabel(data, year)}.`}
        />
        <Legend items={SEGMENTS.map((s) => ({ label: s.label, color: s.color }))} />
        <div className="space-y-2">
          {dist.deciles.map((d) => (
            <div key={d.decile} className="grid grid-cols-[minmax(0,150px)_1fr] items-center gap-3">
              <div className="text-xs leading-4 text-slate-600">
                <span className="block text-sm font-semibold text-slate-800">
                  {groupLabel(d.decile, 10)}
                </span>
                {boundLabel(cuts, d.decile, 10)}
              </div>
              <SplitBar
                segments={SEGMENTS.map((s) => ({
                  key: s.key,
                  label: s.label,
                  value: d[s.key] ?? 0,
                  color: s.color,
                }))}
              />
            </div>
          ))}
        </div>
        {measure === "taxable" && dist.zero_share > 0.02 && (
          <p className="text-xs leading-5 text-slate-500">
            {formatShare(dist.zero_share)} of households have no taxable income; they share the
            lowest decile, which therefore holds more than a tenth of households.
          </p>
        )}
        <div className="space-y-3 pt-2">
          <Toggle value={decileMetric} onChange={setDecileMetric} options={DECILE_METRICS} />
          <PEImpactBarChart
            data={dist.deciles.map((d) => ({
              name: String(d.decile),
              value: d[decileMetric] ?? 0,
              hoverText: `${m.format(d[decileMetric] ?? 0)} in decile ${d.decile}`,
            }))}
            height={320}
            xAxisLabel="Household decile"
            yAxisLabel={m.axis}
            yTickFormatter={m.format}
            barLabelFormatter={m.format}
          />
          <ChartLogo />
        </div>
        <TableToggle>
          <Table
            minWidth={760}
            columns={[
              { key: "decile", header: "Decile" },
              { key: "range", header: "Income" },
              {
                key: "households_m",
                header: "Households",
                align: "right",
                format: (v) => formatMillions(v, 2),
              },
              {
                key: "people_m",
                header: "People",
                align: "right",
                format: (v) => formatMillions(v, 2),
              },
              {
                key: "passported",
                header: "Passported",
                align: "right",
                format: (v) => formatShare(v ?? 0),
              },
              {
                key: "income_only",
                header: "Income test alone",
                align: "right",
                format: (v) => formatShare(v ?? 0),
              },
              {
                key: "not_eligible",
                header: "Does not qualify",
                align: "right",
                format: (v) => formatShare(v ?? 0),
              },
              {
                key: "cost_share",
                header: "Share of spending",
                align: "right",
                format: (v) => formatShare(v ?? 0, 1),
              },
              {
                key: "average_gain",
                header: "Average gain",
                align: "right",
                format: (v) => formatCurrency(v ?? 0),
              },
              {
                key: "ess",
                header: "ESS",
                align: "right",
                format: (v) => Math.round(v).toLocaleString("en-GB"),
              },
            ]}
            rows={dist.deciles.map((d) => ({
              ...d,
              key: d.decile,
              range: boundLabel(cuts, d.decile, 10),
            }))}
          />
        </TableToggle>
      </section>
    </>
  );
}
