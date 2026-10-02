"use client";

import { useState } from "react";
import { series } from "../lib/colors";
import { getResult } from "../lib/dataHelpers";
import {
  formatBn,
  formatCurrency,
  formatMillions,
  formatShare,
  formatSignedPp,
  formatSignedThousands,
  formatThousands,
} from "../lib/formatters";
import ChartLogo from "./ChartLogo";
import IncomeMeasuresSection from "./IncomeMeasuresSection";
import NavigationTabs from "./NavigationTabs";
import OnThisTab from "./OnThisTab";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import PEWinnersLosersChart from "./charts/PEWinnersLosersChart";
import SectionHeading from "./SectionHeading";
import {
  Legend,
  MetricCard,
  Disclosure,
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
  "energy over 10% of net income":
    "Households spending over 10% of net income on energy",
};

// The reach bars for each housing-cost basis; the energy-cost group is the same in both.
const COVERAGE_GROUPS = {
  bhc: [
    "absolute BHC poverty",
    "relative BHC poverty",
    "lowest four BHC deciles",
    "energy over 10% of net income",
  ],
  ahc: [
    "absolute AHC poverty",
    "relative AHC poverty",
    "lowest four AHC deciles",
    "energy over 10% of net income",
  ],
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

function Headline({ result, levels }) {
  const h = result.headline;
  const pov = result.poverty.find(
    (p) => p.measure === "abs_pov_bhc" && p.group === "people",
  );
  const kids = result.poverty.find(
    (p) => p.measure === "abs_pov_bhc" && p.group === "children",
  );
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <MetricCard
        label="Cost"
        value={formatBn(h.cost_bn)}
        note="Total support paid in the year."
      />
      <MetricCard
        label="Households receiving support"
        value={formatMillions(h.recipients_m, 2)}
        note={`${formatShare(h.recipient_share, 1)} of ${formatMillions(h.gb_households_m)} GB households${levels}`}
      />
      <MetricCard
        label="Average per receiving household"
        value={formatCurrency(h.average_per_recipient)}
        note="Total discount per recipient in the selected year."
      />
      <MetricCard
        label="Fewer people in poverty"
        value={pov ? formatThousands(-pov.change_k) : "n/a"}
        note={`Absolute poverty, before housing costs.${kids ? ` Includes ${formatThousands(-kids.change_k)} children.` : ""}`}
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
        description="Average gains across all households in each income group, including those receiving no discount."
      />
      <div className="mb-4">
        <Toggle value={metric} onChange={setMetric} options={DECILE_METRICS} />
      </div>
      <PEImpactBarChart
        data={data}
        height={360}
        xAxisLabel="Income decile"
        yAxisLabel={m.axis}
        yTickFormatter={m.tick}
        barLabelFormatter={m.format}
      />
      <ChartLogo />
      <TableToggle>
        <Table
          columns={[
            { key: "decile", header: "Income decile" },
            { key: metric, header: m.label, format: m.format, align: "right" },
          ]}
          rows={result.deciles}
        />
      </TableToggle>
      <Disclosure>
        <p>
          Deciles rank people by household income adjusted for household size,
          after housing costs. Each group holds a tenth of people, from the
          lowest incomes (1) to the highest (10). Average gains include
          households that receive nothing.
        </p>
      </Disclosure>
      <Disclosure title="How many people gain?" className="mt-3">
        <WinnersSection result={result} />
      </Disclosure>
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
        description={`${formatShare(ahead)} of people gain at least 0.1% of their household net income. Smaller gains count as no change. Funding is not modelled, so there are no losses.`}
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

function InequalitySection({ result }) {
  const q = result.inequality;
  const signedPct = (v) =>
    `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(100 * v).toFixed(2)}%`;
  const card = (label, key, format, note) => {
    const v = q[key];
    return (
      <MetricCard
        label={label}
        value={signedPct(v.change_pct)}
        note={`Relative change: ${format(v.baseline)} → ${format(v.reform)}. ${note}`}
      />
    );
  };
  const gini = (v) => v.toFixed(4);
  const share = (v) => `${(100 * v).toFixed(1)}%`;
  return (
    <section className="section-card space-y-4">
      <SectionHeading
        title="Inequality"
        description="Measures of equivalised household net income across people in Great Britain, before and after the discount."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {card(
          "Gini index, before housing costs",
          "gini_bhc",
          gini,
          "0 is perfect equality and 1 is perfect inequality.",
        )}
        {card(
          "Gini index, after housing costs",
          "gini_ahc",
          gini,
          "Income after rent, mortgage interest and water charges.",
        )}
        {card(
          "Top 10% share of income",
          "top_10_share_bhc",
          share,
          "Share of income held by the highest-income tenth, before housing costs.",
        )}
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

function PovertySection({ result }) {
  const [type, setType] = useState("abs");
  const [basis, setBasis] = useState("bhc");
  const measure = `${type}_pov_${basis}`;
  const rows = result.poverty.filter((p) => p.measure === measure);
  const data = POVERTY_CHART_GROUPS.map((g) => rows.find((p) => p.group === g))
    .filter(Boolean)
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
    <section className="section-card space-y-4">
      <SectionHeading
        title="How does poverty change?"
        description="Percentage reduction in each group’s poverty rate, relative to its rate before the discount."
      />
      <div className="grid gap-5 md:grid-cols-2">
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
        data={data}
        horizontal
        yAxisLabel="Fall in the poverty rate, relative to its baseline level"
        yTickFormatter={(v) => `${(100 * v).toFixed(1)}%`}
        barLabelFormatter={(v) => `${(100 * v).toFixed(1)}%`}
      />
      <ChartLogo />
      <Disclosure>
        <p>
          A fall from 20% to 19% is a 5% reduction, or 1 percentage point. The
          discount counts as household income. Absolute poverty uses the 2010–11
          line uprated by inflation; relative poverty uses 60% of the baseline
          median. The table gives the rates and changes in people.
        </p>
      </Disclosure>
      <TableToggle>
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
              format: (v) => formatSignedPp(v),
            },
            {
              key: "change_k",
              header: "Change in people",
              align: "right",
              format: (v) => formatSignedThousands(v),
            },
          ]}
          rows={rows}
        />
      </TableToggle>
    </section>
  );
}

function ReachSection({ result }) {
  const [basis, setBasis] = useState("bhc");
  const rows = COVERAGE_GROUPS[basis]
    .map((g) => result.coverage.find((c) => c.group === g))
    .filter(Boolean);
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="Which households does the reform reach?"
        description="Eligibility among households in poverty, on low incomes or with high energy costs."
      />
      <Toggle
        label="Housing costs"
        value={basis}
        onChange={setBasis}
        options={HOUSING_BASES}
      />
      <Legend
        items={[
          { label: "Passported by a means-tested benefit", color: series.a },
          { label: "Qualifies through the income test alone", color: series.b },
          { label: "Does not qualify", color: series.neutral },
        ]}
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
                    label: "Passported",
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
        description="Share of households qualifying through benefits or the income test, ordered by the share qualifying through benefits."
      />
      <Toggle
        value={by}
        onChange={setBy}
        options={[
          { value: "region", label: "Region" },
          { value: "household_type", label: "Household type" },
        ]}
      />
      <Legend
        items={[
          { label: "Passported", color: series.a },
          { label: "Income test alone", color: series.b },
          { label: "Not eligible", color: series.neutral },
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
                  label: "Passported",
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
                  label: "Not eligible",
                  value: 1 - r.eligible_rate,
                  color: series.neutral,
                },
              ]}
            />
          </div>
        ))}
      </div>
      <Disclosure title="Definitions and precision">
        <p>
          The table also shows payments and poverty effects. “In poverty,
          reached” uses absolute poverty after housing costs. ESS is effective
          sample size: small values indicate that few survey records drive the
          estimate.
        </p>
      </Disclosure>
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
              header: "Eligible",
              align: "right",
              format: (v) => formatShare(v),
            },
            {
              key: "passported_rate",
              header: "Passported",
              align: "right",
              format: (v) => formatShare(v),
            },
            {
              key: "income_only_rate",
              header: "Income test only",
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
              header: "Gain, % income",
              align: "right",
              format: (v) => `${(100 * v).toFixed(2)}%`,
            },
            {
              key: "abs_ahc_poverty_reached",
              header: "In poverty, reached",
              align: "right",
              format: (v) => formatShare(v),
            },
            {
              key: "abs_ahc_poverty_not_reached_k",
              header: "In poverty, not reached",
              align: "right",
              format: (v) => formatThousands(v),
            },
            {
              key: "people_out_of_rel_ahc_poverty_k",
              header: "People out of rel. poverty",
              align: "right",
              format: (v) => formatThousands(v),
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
    </section>
  );
}

const OVERVIEW_SECTIONS = [
  { id: "overview-headlines", label: "At a glance" },
  { id: "overview-gains", label: "Who gains" },
  { id: "overview-poverty", label: "Poverty and inequality" },
  { id: "overview-reach", label: "Who qualifies" },
  { id: "overview-groups", label: "Regions and households" },
];

export default function ReformTab({
  data,
  dataset,
  scenario,
  view,
  onViewChange,
  onMethodology,
}) {
  const [outcome, setOutcome] = useState("poverty");
  const result = getResult(
    data,
    scenario.year,
    scenario.preset,
    scenario.variant,
    dataset,
  );
  const efrs =
    data.results[scenario.year]?.rf_flat?.efrs_1573?.headline.gb_households_m;
  const micro =
    data.results[scenario.year]?.rf_flat?.microcosm_979?.headline
      .gb_households_m;
  const levels =
    dataset === "efrs_1573" && efrs && micro
      ? `; Enhanced FRS counts run ${formatShare(efrs / micro - 1)} above Microcosm's.`
      : ".";
  return (
    <div className="space-y-5">
      <NavigationTabs
        id="impacts"
        label="General impacts views"
        compact
        value={view}
        onChange={onViewChange}
        options={[
          { value: "overview", label: "Overview" },
          { value: "eligibility", label: "Eligibility across income measures" },
        ]}
      />
      <div
        hidden
        role="tabpanel"
        id={`impacts-panel-${view === "overview" ? "eligibility" : "overview"}`}
        aria-labelledby={`impacts-tab-${view === "overview" ? "eligibility" : "overview"}`}
      />
      <div
        role="tabpanel"
        id={`impacts-panel-${view}`}
        aria-labelledby={`impacts-tab-${view}`}
        tabIndex={0}
      >
        {!result ? (
          <p className="section-card">No results for this combination.</p>
        ) : view === "eligibility" ? (
          <IncomeMeasuresSection
            data={data}
            dataset={dataset}
            {...scenario}
            onMethodology={onMethodology}
          />
        ) : (
          <div className="space-y-6">
            <section id="overview-headlines" className="scroll-mt-24">
              <h2 className="mb-3 text-lg font-semibold">
                The reform at a glance
              </h2>
              <Headline result={result} levels={levels} />
              <p className="mt-3 text-xs leading-5 text-slate-500">
                The estimate assumes full take-up of the discount. Funding and
                behavioural changes are not modelled.{" "}
                <button
                  className="text-link"
                  onClick={() => onMethodology("method-limitations")}
                >
                  Assumptions and limits
                </button>
              </p>
            </section>
            <div className="reading-layout">
              <div className="reading-body space-y-6">
                <div id="overview-gains">
                  <DecileSection result={result} />
                </div>
                <div id="overview-poverty" className="space-y-3">
                  <Toggle
                    label="Income outcomes"
                    value={outcome}
                    onChange={setOutcome}
                    options={[
                      { value: "poverty", label: "Poverty" },
                      { value: "inequality", label: "Inequality" },
                    ]}
                  />
                  {outcome === "poverty" ? (
                    <PovertySection result={result} />
                  ) : (
                    <InequalitySection result={result} />
                  )}
                  <button
                    className="text-link"
                    onClick={() => onMethodology("method-impacts")}
                  >
                    How income outcomes are measured
                  </button>
                </div>
                <div id="overview-reach" className="space-y-3">
                  <ReachSection result={result} />
                  <button
                    className="text-link"
                    onClick={() => onViewChange("eligibility")}
                  >
                    Explore eligibility across income measures →
                  </button>
                </div>
                <div id="overview-groups">
                  <BreakdownSection result={result} />
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
