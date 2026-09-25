"use client";

import { useState } from "react";
import { series } from "../lib/colors";
import { THIN_ESS, getDistributions, yearLabel } from "../lib/dataHelpers";
import {
  BASIS_OPTIONS,
  INCOME_COUNT_LABELS,
  MEASURE_NAMES,
  MEASURE_OPTIONS,
  boundLabel,
  crosstabKey,
  distributionKey,
  groupLabel,
} from "../lib/distributions";
import { formatCurrency, formatMillions, formatShare } from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import CrossTabHeatmap from "./charts/CrossTabHeatmap";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import SectionHeading from "./SectionHeading";
import { Legend, MetricCard, Note, SplitBar, Table, TableToggle, Toggle, Warning } from "./ui";

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

const HEAT_METRICS = [
  { value: "eligible", label: "Share eligible" },
  { value: "household_share", label: "Share of households" },
  { value: "cost_share", label: "Share of spending" },
];

const HEAT_COLUMNS = [
  { value: "taxable", label: "Household taxable income" },
  { value: "net", label: "Household net income" },
];

const RULES = [
  { preset: "rf_flat", label: "Highest individual income below £24,000 (flat and tiered)" },
  { preset: "rf_household_income", label: "Equivalised household income below £30,000" },
  { preset: "passport_only", label: "Passporting only" },
];

const GROUPS = [
  { value: "low", label: "Do not qualify, lowest three deciles" },
  { value: "top", label: "Income test alone, top half" },
  { value: "passported", label: "Passported, top half" },
];

const SEGMENTS = [
  { key: "passported", label: "Passported by a means-tested benefit", color: series.a },
  { key: "income_only", label: "Qualifies through the income test alone", color: series.b },
  { key: "not_eligible", label: "Does not qualify", color: series.neutral },
];

function thinNote(profile) {
  return profile && profile.households_m > 0 && profile.ess < THIN_ESS
    ? " Rests on few survey records."
    : "";
}

function composition(profile, population, by) {
  if (!profile?.households_m) return [];
  const shares = by === "household_type" ? profile.by_household_type : profile.by_incomes;
  const reference = by === "household_type" ? population.by_household_type : population.by_incomes;
  return Object.entries(shares ?? {}).map(([group, share]) => ({
    name: by === "household_type" ? group : INCOME_COUNT_LABELS[group],
    value: share ?? 0,
    hoverText: `${formatShare(share ?? 0)} of this group; ${formatShare(reference?.[group] ?? 0)} of all GB households`,
  }));
}

export default function IncomeMeasuresSection({ data, dataset, year, preset, variant, schedule }) {
  const [measure, setMeasure] = useState("eq");
  const [basis, setBasis] = useState("bhc");
  const [decileMetric, setDecileMetric] = useState("cost_share");
  const [heatColumn, setHeatColumn] = useState("taxable");
  const [heatMetric, setHeatMetric] = useState("eligible");
  const [makeUp, setMakeUp] = useState("household_type");
  const [group, setGroup] = useState("low");

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
  const crosstab = block.crosstabs[crosstabKey(basis, heatColumn)];
  const low = dist.low_not_eligible;
  const top = dist.top_income_only;
  const passported = dist.top_passported;
  const profiles = { low, top, passported };
  const basisLabel = BASIS_OPTIONS.find((b) => b.value === basis).label.toLowerCase();
  const measureName =
    measure === "taxable" ? MEASURE_NAMES.taxable : `${MEASURE_NAMES[measure]} ${basisLabel}`;
  const individualTest = schedule?.income_test && !schedule?.household_equivalised;

  return (
    <>
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="Eligibility across income measures"
          description="The income test looks at the highest taxable income of anyone in the household. These charts rank households by three wider measures of household income instead, to show which households the rules reach or leave out across each distribution."
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

      <section className="section-card space-y-4">
        <SectionHeading
          title="Equivalised income against household income"
          description={`Households split into fifths twice: by equivalised household income ${basisLabel} (rows) and by household income without the size adjustment (columns). Households on the diagonal from bottom left to top right rank the same on both; large households tend to sit below it (higher household income, lower once adjusted for size) and single adults above it.`}
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            label="Columns"
            value={heatColumn}
            onChange={setHeatColumn}
            options={HEAT_COLUMNS}
          />
          <Toggle
            label="Cells show"
            value={heatMetric}
            onChange={setHeatMetric}
            options={HEAT_METRICS}
          />
        </div>
        {measure === "taxable" && (
          <p className="text-xs leading-5 text-slate-500">
            Rows use equivalised income {basisLabel}; switch the housing-cost basis with an
            equivalised or net income measure selected above.
          </p>
        )}
        <CrossTabHeatmap
          cells={crosstab.cells}
          rowCuts={crosstab.row_cut_points}
          colCuts={crosstab.col_cut_points}
          metric={heatMetric}
          rowTitle={`Equivalised household income, ${basisLabel}`}
          colTitle={
            heatColumn === "taxable"
              ? "Household taxable income"
              : `Household net income, ${basisLabel}`
          }
        />
        <TableToggle>
          <Table
            minWidth={680}
            columns={[
              { key: "row", header: "Equivalised quintile" },
              { key: "col", header: "Household quintile" },
              {
                key: "households_m",
                header: "Households",
                align: "right",
                format: (v) => formatMillions(v, 2),
              },
              {
                key: "eligible",
                header: "Eligible",
                align: "right",
                format: (v) => (v == null ? "–" : formatShare(v)),
              },
              {
                key: "income_only",
                header: "Income test alone",
                align: "right",
                format: (v) => (v == null ? "–" : formatShare(v)),
              },
              {
                key: "cost_share",
                header: "Share of spending",
                align: "right",
                format: (v) => formatShare(v ?? 0, 1),
              },
              {
                key: "ess",
                header: "ESS",
                align: "right",
                format: (v) => Math.round(v).toLocaleString("en-GB"),
              },
            ]}
            rows={crosstab.cells.map((c) => ({ ...c, key: `${c.row}-${c.col}` }))}
          />
        </TableToggle>
      </section>

      <section className="section-card space-y-4">
        <SectionHeading
          title="Where eligibility and income diverge"
          description={`Three groups, ranking households by ${measureName}: households in the lowest three deciles that do not qualify, and households in the top half that qualify, either through the income test alone or through a passporting benefit.`}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Do not qualify, in the lowest three deciles"
            value={formatMillions(low.households_m, 2)}
            note={
              low.households_m
                ? `${formatShare(low.share_of_base ?? 0)} of households in those deciles, with ${formatMillions(low.children_m, 2)} children; ${formatShare(low.rel_pov_ahc ?? 0)} are in relative poverty after housing costs.${thinNote(low)}`
                : measure === "taxable" && individualTest
                  ? "Almost none by construction: if the household's combined taxable income is below £24,000, every member's is too."
                  : "None in this option."
            }
          />
          <MetricCard
            label="Qualify through the income test alone, in the top half"
            value={formatMillions(top.households_m, 2)}
            note={
              !schedule?.income_test
                ? "This option has no income test."
                : top.households_m
                  ? `${formatShare(top.share_of_base ?? 0)} of households qualifying through the income test alone; ${formatShare(top.cost_share ?? 0, 1)} of spending. ${formatShare(top.two_incomes_over_pa ?? 0)} have two or more members with taxable income above £12,570${top.taxable_at_or_above_line != null ? `, and ${formatShare(top.taxable_at_or_above_line)} have combined taxable income of £24,000 or more` : ""}.${thinNote(top)}`
                  : "None in this option."
            }
          />
          <MetricCard
            label="Qualify through a passporting benefit, in the top half"
            value={formatMillions(passported.households_m, 2)}
            note={
              passported.households_m
                ? `${formatShare(passported.share_of_base ?? 0)} of passported households; ${formatShare(passported.cost_share ?? 0, 1)} of spending. Someone in the household receives a means-tested benefit even though the household as a whole sits in the top half.${thinNote(passported)}`
                : "None in this option."
            }
          />
        </div>
        {[low, top, passported].some((g) => thinNote(g)) && dataset !== "microcosm_979" && (
          <Warning>
            At least one group rests on fewer than {THIN_ESS} effective survey records in this
            dataset; treat its make-up as indicative.
          </Warning>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle label="Make-up of" value={group} onChange={setGroup} options={GROUPS} />
          <Toggle
            label="By"
            value={makeUp}
            onChange={setMakeUp}
            options={[
              { value: "household_type", label: "Household type" },
              { value: "incomes", label: "Members with taxable income" },
            ]}
          />
        </div>
        {profiles[group].households_m ? (
          <PEImpactBarChart
            horizontal
            data={composition(profiles[group], block.population, makeUp)}
            yAxisLabel="Share of the group (hover for the share of all GB households)"
            yTickFormatter={(v) => formatShare(v)}
            barLabelFormatter={(v) => formatShare(v)}
          />
        ) : (
          <p className="text-sm text-slate-500">No households in this group.</p>
        )}
        <TableToggle label="Compare with the other rules">
          <Table
            minWidth={640}
            columns={[
              { key: "rule", header: "Rule" },
              { key: "low", header: "Do not qualify, lowest three deciles", align: "right" },
              { key: "top", header: "Income test alone, top half", align: "right" },
              { key: "topCost", header: "Their share of spending", align: "right" },
              { key: "passported", header: "Passported, top half", align: "right" },
            ]}
            rows={RULES.map(({ preset: p, label }) => {
              const other = getDistributions(data, year, p, dataset)?.distributions?.[key];
              return {
                key: p,
                rule: label,
                low: other ? formatMillions(other.low_not_eligible.households_m, 2) : "n/a",
                top: other ? formatMillions(other.top_income_only.households_m, 2) : "n/a",
                topCost: other ? formatShare(other.top_income_only.cost_share ?? 0, 1) : "n/a",
                passported: other ? formatMillions(other.top_passported.households_m, 2) : "n/a",
              };
            })}
          />
        </TableToggle>
      </section>
    </>
  );
}
