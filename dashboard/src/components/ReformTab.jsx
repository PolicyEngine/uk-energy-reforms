"use client";

import { useState } from "react";
import { series } from "../lib/colors";
import { cutOffReceiptUrl, getResult } from "../lib/dataHelpers";
import {
  formatBn,
  formatCurrency,
  formatMillions,
  formatRoundedThousands,
  formatShare,
  formatSignedPct,
  formatSignedPp,
  formatSignedThousands,
  formatThousands,
} from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import IncomeMeasuresSection from "./IncomeMeasuresSection";
import OnThisTab from "./OnThisTab";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import PEWinnersLosersChart from "./charts/PEWinnersLosersChart";
import SectionHeading from "./SectionHeading";
import {
  Legend,
  MetricCard,
  Disclosure,
  SourceLink,
  SplitBar,
  Table,
  TableToggle,
  Toggle,
} from "./ui";

const COVERAGE_LABELS = {
  "absolute BHC poverty": "Households in absolute poverty before housing costs",
  "relative BHC poverty": "Households in relative poverty before housing costs",
  "lowest four BHC deciles":
    "Households in the four lowest income deciles before housing costs",
  "absolute AHC poverty": "Households in absolute poverty after housing costs",
  "relative AHC poverty": "Households in relative poverty after housing costs",
  "lowest four AHC deciles":
    "Households in the four lowest income deciles after housing costs",
};

// The reach bars for each housing-cost basis.
const COVERAGE_GROUPS = {
  bhc: ["absolute BHC poverty", "relative BHC poverty", "lowest four BHC deciles"],
  ahc: ["absolute AHC poverty", "relative AHC poverty", "lowest four AHC deciles"],
};

const POVERTY_MEASURES = {
  rel_pov_ahc: "Relative poverty, after housing costs",
  rel_pov_bhc: "Relative poverty, before housing costs",
  abs_pov_ahc: "Absolute poverty, after housing costs",
  abs_pov_bhc: "Absolute poverty, before housing costs",
};

const POVERTY_GROUPS = {
  people: "All people",
  children: "Children",
  working_age_adults: "Working-age adults",
  pensioners: "Pensioners",
};

const DECILE_METRICS = [
  {
    value: "average_gain",
    label: "Average gain (£)",
    axis: "Average change in net income",
    format: (v) => formatCurrency(v),
    tick: (v) => formatCurrency(v),
    hover: (v) => `${formatCurrency(v)} a year on average`,
  },
  {
    value: "gain_pct_net_income",
    label: "% of net income",
    axis: "Change in net income",
    format: (v) => `${(100 * v).toFixed(2)}%`,
    tick: (v) => `${(100 * v).toFixed(2)}%`,
    hover: (v) => `${(100 * v).toFixed(2)}% of net income`,
  },
  {
    value: "share_receiving",
    label: "Share receiving",
    axis: "Households receiving",
    format: (v) => formatShare(v),
    tick: (v) => formatShare(v),
    hover: (v) => `${formatShare(v)} of households receive the discount`,
  },
];

function Headline({ result }) {
  const h = result.headline;
  const pov = result.poverty.find(
    (p) => p.measure === "abs_pov_bhc" && p.group === "people",
  );
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Cost"
        icon="cost"
        value={formatBn(h.cost_bn)}
        note="Total support paid in the year, if every eligible household receives it."
      />
      <MetricCard
        label="Households receiving support"
        icon="households"
        value={formatMillions(h.recipients_m, 2)}
        note={`${formatShare(h.recipient_share, 1)} of ${formatMillions(h.gb_households_m)} GB households.`}
      />
      <MetricCard
        label="Average per receiving household"
        icon="average"
        value={formatCurrency(h.average_per_recipient)}
        note="Total discount per recipient in the selected year."
      />
      <MetricCard
        label="Fewer people in poverty"
        icon="poverty"
        value={pov?.change_k != null ? formatRoundedThousands(-pov.change_k) : "n/a"}
        note={`Absolute poverty before housing costs, counting the discount as income. Rounded: it rests on an effective sample of ${pov?.moved_ess != null ? Math.round(pov.moved_ess) : "few"} households.`}
      />
    </div>
  );
}

function DecileSection({ result }) {
  const [metric, setMetric] = useState("average_gain");
  const m = DECILE_METRICS.find((x) => x.value === metric);
  const data = result.deciles.map((d) => ({
    name: String(d.decile),
    value: d[metric],
    hoverText: `${m.hover(d[metric])} in decile ${d.decile}`,
  }));
  return (
    <section className="section-card">
      <SectionHeading
        title="Who gains across the income distribution?"
        description="Average gain for each tenth of people, ranked from the lowest to the highest income. Averages include households that receive £0, so they reflect both how many qualify in each group and how much they receive. Switch to see gains as a share of net income, or the share of each group receiving support."
      />
      <div className="mb-4">
        <Toggle value={metric} onChange={setMetric} options={DECILE_METRICS} />
      </div>
      <PEImpactBarChart
        data={data}
        height={360}
        xAxisLabel="Income decile of people, after housing costs"
        yAxisLabel={m.axis}
        yTickFormatter={m.tick}
        barLabelFormatter={m.format}
      />
      <ChartLogo />
      <div className="chart-footer">
        <Disclosure title="Details, numbers and how many people gain">
          <p>
            Deciles rank people by household income adjusted for household size,
            after housing costs. Each group holds a tenth of people, from the
            lowest incomes (1) to the highest (10). Average gains include
            households that receive £0.
          </p>
          <Table
            columns={[
              { key: "decile", header: "Income decile" },
              {
                key: metric,
                header: m.label,
                format: m.format,
                align: "right",
              },
            ]}
            rows={result.deciles}
          />
          <WinnersSection result={result} />
        </Disclosure>
      </div>
    </section>
  );
}

const WINNER_KEYS = {
  gainMore5: "gain_more_than_5pct",
  gainLess5: "gain_less_than_5pct",
  noChange: "no_change",
  loseLess5: "lose_less_than_5pct",
  loseMore5: "lose_more_than_5pct",
};

function toSegments(row) {
  return Object.fromEntries(
    Object.entries(WINNER_KEYS).map(([k, v]) => [k, row[v] ?? 0]),
  );
}

function WinnersSection({ result }) {
  const wl = result.winners_losers;
  const ahead = wl.all.gain_more_than_5pct + wl.all.gain_less_than_5pct;
  return (
    <div>
      <SectionHeading
        title="How many people gain?"
        description={`${formatShare(ahead)} of people gain at least 0.1% of their household net income. Smaller gains count as no change. Gains are measured against household net income, so the same payment is a larger share of a lower income. Funding is not modelled, so there are no losses.`}
      />
      <PEWinnersLosersChart
        allData={toSegments(wl.all)}
        data={wl.by_decile.map((d) => ({
          name: String(d.decile),
          ...toSegments(d),
        }))}
      />
      <ChartLogo />
    </div>
  );
}

const INEQUALITY_MEASURES = [
  {
    key: "gini",
    label: "Gini index",
    format: (v) => v.toFixed(4),
    change: (d) => `${d < 0 ? "\u2212" : d > 0 ? "+" : ""}${Math.abs(d).toFixed(4)}`,
  },
  {
    key: "top_10_share",
    label: "Top 10% income share",
    format: (v) => formatShare(v, 1),
    change: (d) => formatSignedPp(100 * d, 2),
  },
  {
    key: "top_1_share",
    label: "Top 1% income share",
    format: (v) => formatShare(v, 2),
    change: (d) => formatSignedPp(100 * d, 3),
  },
];

function InequalitySection({ result, onMethodology }) {
  const [basis, setBasis] = useState("bhc");
  const measures = INEQUALITY_MEASURES.map((m) => ({
    ...m,
    value: result.inequality[`${m.key}_${basis}`],
  })).filter((m) => m.value);
  const data = measures.map(({ label, format, value }) => ({
    name: label,
    // Bars show the fall, so they grow from left to right like the poverty chart.
    value: -value.change_pct,
    hoverText: `${value.change_pct <= 0 ? "Falls" : "Rises"} by ${formatShare(Math.abs(value.change_pct), 2)}, from ${format(value.baseline)} to ${format(value.reform)}`,
  }));
  return (
    <section className="section-card paired-card">
      <SectionHeading
        title="How does inequality change?"
        description="Percentage fall in each measure, relative to its level before the discount. A lower Gini index or a smaller top income share means income is shared more evenly. Each change reflects the discount's size relative to total household income."
      />
      <Toggle
        label="Housing costs"
        value={basis}
        onChange={setBasis}
        options={HOUSING_BASES}
      />
      <PEImpactBarChart
        height={280}
        data={data}
        horizontal
        yAxisLabel="Fall in measure (% of baseline)"
        yTickFormatter={(v) => `${(100 * v).toFixed(2)}%`}
        barLabelFormatter={(v) => `${(100 * v).toFixed(2)}%`}
      />
      <ChartLogo />
      <div className="chart-footer">
        <Disclosure title="How to read this chart, with the numbers">
          <p>
            All measures use household net income adjusted for household size,
            across people in Great Britain. The Gini index runs from 0 (perfect
            equality) to 1 (perfect inequality). Income shares are the share
            held by the highest-income tenth or hundredth of people. After
            housing costs deducts rent, mortgage interest and water charges.
          </p>
          <button
            className="text-link"
            onClick={() => onMethodology("method-impacts")}
          >
            How income outcomes are measured →
          </button>

          <Table
            columns={[
              { key: "label", header: "Measure" },
              {
                key: "baseline",
                header: "Baseline",
                align: "right",
                format: (_, r) => r.format(r.value.baseline),
              },
              {
                key: "reform",
                header: "With discount",
                align: "right",
                format: (_, r) => r.format(r.value.reform),
              },
              {
                key: "difference",
                header: "Change",
                align: "right",
                format: (_, r) => r.change(r.value.reform - r.value.baseline),
              },
              {
                key: "change",
                header: "Relative change",
                align: "right",
                format: (_, r) => formatSignedPct(100 * r.value.change_pct, 2),
              },
            ]}
            rows={measures}
          />
        </Disclosure>
      </div>
    </section>
  );
}

const POVERTY_CHART_GROUPS = [
  "children",
  "working_age_adults",
  "pensioners",
  "people",
];

const POVERTY_TYPES = [
  { value: "abs", label: "Absolute poverty" },
  { value: "rel", label: "Relative poverty" },
];

const HOUSING_BASES = [
  { value: "bhc", label: "Before housing costs" },
  { value: "ahc", label: "After housing costs" },
];

function PovertySection({ result, onMethodology }) {
  const [type, setType] = useState("abs");
  const [basis, setBasis] = useState("bhc");
  const measure = `${type}_pov_${basis}`;
  const rows = result.poverty.filter((p) => p.measure === measure);
  const data = POVERTY_CHART_GROUPS.map((g) => rows.find((p) => p.group === g))
    .filter((p) => p && p.reform_rate != null)
    .map((p) => {
      const change = p.baseline_rate ? p.reform_rate / p.baseline_rate - 1 : 0;
      // Bars show the fall, so they grow from left to right like the other charts.
      return {
        name: POVERTY_GROUPS[p.group],
        value: -change,
        hoverText: `${change <= 0 ? "Falls" : "Rises"} by ${formatShare(Math.abs(change), 1)}, from ${formatShare(p.baseline_rate, 1)} to ${formatShare(p.reform_rate, 1)} (${formatSignedThousands(p.change_k)} people)`,
      };
    });
  return (
    <section className="section-card paired-card">
      <SectionHeading
        title="How does poverty change?"
        description="Percentage fall in each group’s poverty rate, relative to its rate before the discount. Choose the poverty line and whether housing costs are deducted; the discount counts as household income. Hover over a bar for the rates before and after, and the change in people."
      />
      <div className="flex flex-wrap gap-4">
        <Toggle
          label="Poverty line"
          value={type}
          onChange={setType}
          options={POVERTY_TYPES}
        />
        <Toggle
          label="Housing costs"
          value={basis}
          onChange={setBasis}
          options={HOUSING_BASES}
        />
      </div>
      <PEImpactBarChart
        height={280}
        data={data}
        horizontal
        yAxisLabel="Fall in poverty rate (% of baseline)"
        yTickFormatter={(v) => `${(100 * v).toFixed(1)}%`}
        barLabelFormatter={(v) => `${(100 * v).toFixed(1)}%`}
      />
      <ChartLogo />
      <div className="chart-footer">
        <Disclosure title="How to read this chart, with the numbers">
          <p>
            A fall from 20% to 19% is a 5% reduction, or 1 percentage point. The
            discount counts as household income, so these are income-equivalent
            readings: delivered as a cut in unit prices, as the report proposes,
            it would not show up in the income that official poverty statistics
            measure. Absolute poverty uses the official line since March 2026:
            60% of the 2024-25 median, held constant in real terms. Relative
            poverty uses 60% of the median before the discount, held fixed so
            the line does not move with the transfer; official statistics
            recompute the median each year.
          </p>
          <p>
            The change in people counts those whose household moves above a
            line, so it depends on how many people sit just below it. It moves
            between years and datasets, and it rests on few survey households:
            the table gives each change&apos;s effective sample, and shows
            &ldquo;–&rdquo; where fewer than 10 survey households cross the line.
            The Baseline tab sets the starting rates beside the official ones.
          </p>
          <button
            className="text-link"
            onClick={() => onMethodology("method-impacts")}
          >
            How income outcomes are measured →
          </button>

          <Table
            minWidth={640}
            columns={[
              {
                key: "measure",
                header: "Measure",
                format: (v) => POVERTY_MEASURES[v] ?? v,
              },
              {
                key: "group",
                header: "Group",
                format: (v) => POVERTY_GROUPS[v] ?? v,
              },
              {
                key: "baseline_rate",
                header: "Baseline rate",
                align: "right",
                format: (v) => formatShare(v, 1),
              },
              {
                key: "change_pp",
                header: "Change",
                align: "right",
                format: (v) => (v == null ? "–" : formatSignedPp(v)),
              },
              {
                key: "change_k",
                header: "Change in people",
                align: "right",
                format: (v) => (v == null ? "–" : formatSignedThousands(v)),
              },
              {
                key: "moved_ess",
                header: "Effective sample",
                align: "right",
                format: (v) => (v == null ? "–" : Math.round(v).toLocaleString("en-GB")),
              },
            ]}
            rows={rows}
          />
        </Disclosure>
      </div>
    </section>
  );
}

function ReachSection({ result, year }) {
  const [basis, setBasis] = useState("bhc");
  const rows = COVERAGE_GROUPS[basis]
    .map((g) => result.coverage.find((c) => c.group === g))
    .filter(Boolean);
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="Which households does the reform reach?"
        description="Share of households in each group that qualify, split by route: passported by a means-tested benefit, or through the income test alone. Groups: households in poverty, or in the four lowest income deciles."
      />
      <Toggle
        label="Housing costs"
        value={basis}
        onChange={setBasis}
        options={HOUSING_BASES}
      />
      <div className="space-y-5">
        {rows.map((c) => {
          const passport = c.covered_by_passport;
          const incomeOnly = Math.max(c.covered - passport, 0);
          const missed = Math.max(1 - c.covered, 0);
          return (
            <div key={c.group}>
              <p className="mb-2 text-sm font-semibold text-slate-800">
                {COVERAGE_LABELS[c.group] ?? c.group} (
                {formatMillions(c.households_m)}):{" "}
                {formatMillions(c.missed_m, 2)} do not qualify
              </p>
              <SplitBar
                segments={[
                  {
                    key: "p",
                    label: "Passported by a benefit",
                    value: passport,
                    color: series.a,
                  },
                  {
                    key: "i",
                    label: "Income test alone",
                    value: incomeOnly,
                    color: series.b,
                  },
                  {
                    key: "n",
                    label: "Does not qualify",
                    value: missed,
                    color: series.neutral,
                  },
                ]}
              />
            </div>
          );
        })}
      </div>
      <Legend
        items={[
          { label: "Passported by a benefit", color: series.a },
          { label: "Income test alone", color: series.b },
          { label: "Does not qualify", color: series.neutral },
        ]}
      />
      {result.schedule.income_test && (
        <p className="chart-footer text-xs leading-5 text-slate-500">
          <span>
            Counts of households within £1,000 of each income cut-off are in
            the{" "}
            <SourceLink href={cutOffReceiptUrl(year)}>
              detailed results (report.md)
            </SourceLink>
            .
          </span>
        </p>
      )}
    </section>
  );
}

function BreakdownSection({ result }) {
  const [by, setBy] = useState("region");
  // Ordered by the share passported, the first segment of each bar, highest first.
  const rows = (by === "region" ? result.by_region : result.by_household_type)
    .map((r) => ({
      ...r,
      key: r.group,
      income_only_rate: Math.max(r.eligible_rate - r.passported_rate, 0),
    }))
    .sort((a, b) => b.passported_rate - a.passported_rate);
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="How does eligibility vary by region and household type?"
        description="Share of households qualifying through benefits or the income test, ordered by the share qualifying through benefits. The table also shows payments and poverty effects. Its poverty columns use absolute poverty before housing costs, as in the headline figures; “–” marks a change resting on fewer than 10 survey households. ESS is effective sample size: small values indicate that few survey records drive the estimate."
      />
      <Toggle
        value={by}
        onChange={setBy}
        options={[
          { value: "region", label: "Region" },
          { value: "household_type", label: "Household type" },
        ]}
      />
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.group} className="bar-row">
            <span className="text-sm text-slate-700">{r.group}</span>
            <SplitBar
              segments={[
                {
                  key: "p",
                  label: "Passported by a benefit",
                  value: r.passported_rate,
                  color: series.a,
                },
                {
                  key: "i",
                  label: "Income test alone",
                  value: r.income_only_rate,
                  color: series.b,
                },
                {
                  key: "n",
                  label: "Does not qualify",
                  value: 1 - r.eligible_rate,
                  color: series.neutral,
                },
              ]}
            />
          </div>
        ))}
      </div>
      <Legend
        items={[
          { label: "Passported by a benefit", color: series.a },
          { label: "Income test alone", color: series.b },
          { label: "Does not qualify", color: series.neutral },
        ]}
      />
      <div className="chart-footer">
        <TableToggle>
          <Table
            minWidth={1180}
            columns={[
              {
                key: "group",
                header: by === "region" ? "Region" : "Household type",
              },
              {
                key: "households_m",
                header: "Households",
                align: "right",
                format: (v) => formatMillions(v, 2),
              },
              {
                key: "eligible_rate",
                header: "% eligible",
                align: "right",
                format: (v) => formatShare(v),
              },
              {
                key: "passported_rate",
                header: "% passported",
                align: "right",
                format: (v) => formatShare(v),
              },
              {
                key: "income_only_rate",
                header: "% income test only",
                align: "right",
                format: (v) => formatShare(v),
              },
              {
                key: "cost_share",
                header: "Share of cost",
                align: "right",
                format: (v) => formatShare(v, 1),
              },
              {
                key: "average_per_recipient",
                header: "Avg per recipient",
                align: "right",
                format: (v) => formatCurrency(v),
              },
              {
                key: "gain_pct_net_income",
                header: "Gain, % of net income",
                align: "right",
                format: (v) => `${(100 * v).toFixed(2)}%`,
              },
              {
                key: "abs_bhc_poverty_reached",
                header: "Households in poverty, % reached",
                align: "right",
                format: (v) => formatShare(v),
              },
              {
                key: "abs_bhc_poverty_not_reached_k",
                header: "Households in poverty not reached",
                align: "right",
                format: (v) => formatThousands(v),
              },
              {
                key: "people_out_of_abs_bhc_poverty_k",
                header: "People out of poverty",
                align: "right",
                format: (v) => (v == null ? "–" : formatThousands(v)),
              },
              {
                key: "ess",
                header: "ESS",
                align: "right",
                format: (v) => Math.round(v).toLocaleString("en-GB"),
              },
            ]}
            rows={rows}
          />
        </TableToggle>
      </div>
    </section>
  );
}

const OVERVIEW_SECTIONS = [
  { id: "overview-headlines", label: "At a glance" },
  { id: "overview-gains", label: "Who gains" },
  { id: "overview-poverty", label: "Poverty and inequality" },
  { id: "overview-reach", label: "Who qualifies" },
  { id: "overview-groups", label: "Regions and households" },
  { id: "overview-targeting", label: "Income measures" },
];

export default function ReformTab({ data, dataset, scenario, onMethodology }) {
  const result = getResult(
    data,
    scenario.year,
    scenario.preset,
    scenario.variant,
    dataset,
  );
  // Options with an income test: cost and reach if half of the households eligible
  // through it alone take the discount up (passported households are enrolled).
  const halfTakeUp = result?.schedule?.income_test
    ? result.take_up_sensitivity?.find((t) => t.take_up === 0.5)
    : null;
  return (
    <div className="space-y-5">
      <div>
        {!result ? (
          <p className="section-card">No results for this combination.</p>
        ) : (
          <div className="space-y-6">
            <section
              id="overview-headlines"
              className="section-card scroll-mt-24"
            >
              <SectionHeading
                title="The reform at a glance"
                description="Headline figures for the selected option, payment basis and year. Cost is the total discount paid; the poverty figure counts people moved above the absolute poverty line, before housing costs."
              />
              <Headline result={result} />
              <p className="chart-footer text-xs leading-5 text-slate-500">
                <span>
                  The estimate assumes full take-up of the discount.
                  {halfTakeUp
                    ? ` If half of the households eligible through the income test alone took it up, it would cost ${formatBn(halfTakeUp.cost_bn)} and reach ${formatMillions(halfTakeUp.recipients_m, 1)} households.`
                    : ""}{" "}
                  Funding and behavioural changes are not modelled.{" "}
                  <button
                    className="text-link"
                    onClick={() => onMethodology("method-limitations")}
                  >
                    Assumptions and limits →
                  </button>
                </span>
              </p>
            </section>
            <div className="reading-layout">
              <div className="reading-body space-y-6">
                <div id="overview-gains">
                  <DecileSection result={result} />
                </div>
                <div id="overview-poverty" className="space-y-3">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <PovertySection
                      result={result}
                      onMethodology={onMethodology}
                    />
                    <InequalitySection
                      result={result}
                      onMethodology={onMethodology}
                    />
                  </div>
                </div>
                <div id="overview-reach" className="space-y-3">
                  <ReachSection result={result} year={scenario.year} />
                </div>
                <div id="overview-groups">
                  <BreakdownSection result={result} />
                </div>
                <div id="overview-targeting" className="scroll-mt-24">
                  <IncomeMeasuresSection
                    data={data}
                    dataset={dataset}
                    {...scenario}
                    onMethodology={onMethodology}
                  />
                </div>
              </div>
              <OnThisTab sections={OVERVIEW_SECTIONS} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
