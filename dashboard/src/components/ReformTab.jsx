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
import { colors, series } from "../lib/colors";
import {
  DEFAULT_DATASET,
  DATASET_SHORT,
  PRESET_NOTES,
  PRESET_ORDER,
  describeSchedule,
  getResult,
  yearLabel,
} from "../lib/dataHelpers";
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
import { AXIS_STYLE, GRID_STYLE, TOOLTIP_CONTAINER_STYLE } from "./charts/chartDefaults";
import PEImpactBarChart from "./charts/PEImpactBarChart";
import PEWinnersLosersChart from "./charts/PEWinnersLosersChart";
import SectionHeading from "./SectionHeading";
import { Legend, MetricCard, Note, SplitBar, Table, TableToggle, Toggle, Warning } from "./ui";

// Below this effective sample size a band estimate rests on very few survey records.
const THIN_ESS = 30;

const COVERAGE_LABELS = {
  "absolute AHC poverty": "Households in absolute poverty after housing costs",
  "relative AHC poverty": "Households in relative poverty after housing costs",
  "poorest four AHC deciles": "Households in the four lowest income deciles",
  "energy over 10% of net income": "Households spending over 10% of net income on energy",
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

function Controls({ data, state, setState, result, published, dataset }) {
  const { preset, variant, year } = state;
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="Choose the option"
        description="Each option combines an eligibility rule and a set of support amounts. RF's amounts are the report's averages; scaled to £2bn rescales them so the scheme costs £2bn; bill share takes a percentage off each household's gas and electricity bill, closer to the report's cut in unit prices."
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {PRESET_ORDER.filter((p) => data.results[year]?.[p]).map((p) => (
          <button
            key={p}
            type="button"
            className={`selector-chip ${preset === p ? "active" : ""}`}
            onClick={() => setState({ preset: p })}
          >
            <p className="text-sm font-semibold text-slate-800">{data.meta.presets[p]}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{PRESET_NOTES[p]}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Toggle
          label="Support amounts"
          value={variant}
          onChange={(v) => setState({ variant: v })}
          options={Object.entries(data.meta.variants).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Toggle
          label="Year"
          value={year}
          onChange={(v) => setState({ year: v })}
          options={data.meta.years.map((y) => ({ value: y, label: yearLabel(data, y) }))}
        />
      </div>
      {result && <Note eyebrow="Schedule">{describeSchedule(result.schedule)}</Note>}
      {year === data.meta.years[0] && (
        <p className="text-xs leading-5 text-slate-500">
          {yearLabel(data, year)} runs from April to March, so it covers January to March 2027, the
          window the report proposes for this winter.
        </p>
      )}
      {variant === "bill_share" && result && (
        <BillSharePriceNote data={data} dataset={dataset} result={result} />
      )}
      {dataset === "efrs_1573" && variant === "bill_share" && result && published && (
        <Warning>
          The Enhanced FRS records no energy spend for some households, and a bill share pays them
          nothing: recipients fall from {formatMillions(published.headline.recipients_m, 2)} to{" "}
          {formatMillions(result.headline.recipients_m, 2)} and the average per recipient rises to{" "}
          {formatCurrency(result.headline.average_per_recipient)}. The written analysis sets these
          results aside; use Microcosm for the bill share.
        </Warning>
      )}
    </section>
  );
}

// Each dataset's stored price level against this winter's cap, on Ofgem's 2023
// typical-use basis (the only basis on which the 2024-25 caps are published).
const PRICE_LEVEL = {
  microcosm_979: { label: "2024-25 prices", source: "ofgem_cap_fy2024_25", key: "mean" },
  efrs_1573: {
    label: "April–June 2026 unit rates",
    source: "ofgem_cap_2026_apr_jun",
    key: "at_2023_tdcv",
  },
};

function BillSharePriceNote({ data, dataset, result }) {
  const source = (id) => (data.external_sources ?? []).find((x) => x.id === id);
  const level = PRICE_LEVEL[dataset];
  const base = level && source(level.source)?.value?.[level.key];
  const winter = source("ofgem_cap_2026_oct_dec")?.value?.at_2023_tdcv;
  if (!base || !winter) return null;
  const uplift = winter / base;
  const rate = result.schedule.rates.find((r) => r > 0);
  return (
    <Note eyebrow="Bill share and this winter's prices">
      The percentages are set so the average payment matches RF&apos;s amounts on this
      dataset&apos;s bills, which are at {level.label}. Ofgem&apos;s cap for October–December 2026
      is {formatShare(uplift - 1)} above that price level, so at this winter&apos;s prices the same
      percentages would pay about {formatShare(uplift - 1)} more than shown here.
      {rate
        ? ` Matching RF's averages at those prices would take about ${(100 * (rate / uplift)).toFixed(1)}% rather than ${(100 * rate).toFixed(1)}%.`
        : ""}
    </Note>
  );
}

function Headline({ result, levels }) {
  const h = result.headline;
  const rel = result.poverty.find((p) => p.measure === "rel_pov_ahc" && p.group === "people");
  const kids = result.poverty.find((p) => p.measure === "rel_pov_ahc" && p.group === "children");
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Cost" value={formatBn(h.cost_bn)} note="Total support paid in the year." />
      <MetricCard
        label="Households receiving support"
        value={formatMillions(h.recipients_m, 2)}
        note={`${formatShare(h.recipient_share, 1)} of ${formatMillions(h.gb_households_m)} GB households${levels}`}
      />
      <MetricCard
        label="Average per receiving household"
        value={formatCurrency(h.average_per_recipient)}
        note={`${formatShare(h.passported_share)} passported by a benefit; ${formatShare(h.income_only_share)} through the income test alone.`}
      />
      <MetricCard
        label="People in relative poverty (after housing costs)"
        value={rel ? formatSignedThousands(rel.change_k) : "n/a"}
        note={kids ? `${formatSignedThousands(kids.change_k)} children.` : undefined}
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
        title="Gains by income decile"
        description="Average change in household net income across all households in each decile, receiving or not. Deciles rank people by equivalised household income after housing costs, from the lowest income decile (1) to the highest (10)."
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
  return Object.fromEntries(Object.entries(WINNER_KEYS).map(([k, v]) => [k, row[v] ?? 0]));
}

function WinnersSection({ result }) {
  const wl = result.winners_losers;
  const ahead = wl.all.gain_more_than_5pct + wl.all.gain_less_than_5pct;
  return (
    <section className="section-card">
      <SectionHeading
        title="Winners and losers"
        description={`This option would increase the net income of ${formatShare(ahead)} of people in Great Britain. People are grouped into ten equally sized deciles by equivalised household income after housing costs. The analysis does not model how the scheme is paid for, so nobody loses; a change smaller than 0.1% of net income counts as no change.`}
      />
      <PEWinnersLosersChart
        allData={toSegments(wl.all)}
        data={wl.by_decile.map((d) => ({ name: String(d.decile), ...toSegments(d) }))}
      />
      <ChartLogo />
    </section>
  );
}

function InequalitySection({ result }) {
  const q = result.inequality;
  const signedPct = (v) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(100 * v).toFixed(2)}%`;
  const card = (label, key, format, note) => {
    const v = q[key];
    return (
      <MetricCard
        label={label}
        value={format(v.reform)}
        note={`${note} Baseline ${format(v.baseline)}; relative change ${signedPct(v.change_pct)}.`}
      />
    );
  };
  const gini = (v) => v.toFixed(2);
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

const POVERTY_CHART_GROUPS = ["children", "working_age_adults", "pensioners", "people"];

function PovertySection({ result }) {
  const [measure, setMeasure] = useState("rel_pov_ahc");
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
        title="Poverty"
        description="How far the poverty rate falls for each age group, relative to its level before the discount. The discount counts as household income, as DWP counts the Warm Home Discount. Relative poverty uses 60% of the baseline median; absolute poverty uses the 2010-11 line uprated by CPI."
      />
      <Toggle
        value={measure}
        onChange={setMeasure}
        options={Object.entries(POVERTY_MEASURES).map(([value, label]) => ({ value, label }))}
      />
      <PEImpactBarChart
        data={data}
        horizontal
        yAxisLabel="Fall in the poverty rate, relative to its baseline level"
        yTickFormatter={(v) => `${(100 * v).toFixed(1)}%`}
        barLabelFormatter={(v) => `${(100 * v).toFixed(1)}%`}
      />
      <ChartLogo />
      <TableToggle>
        <Table
          minWidth={640}
          columns={[
            { key: "measure", header: "Measure", format: (v) => POVERTY_MEASURES[v] ?? v },
            { key: "group", header: "Group", format: (v) => POVERTY_GROUPS[v] ?? v },
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
          rows={result.poverty}
        />
      </TableToggle>
    </section>
  );
}

function ReachSection({ result, isPassportOnly }) {
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="Who the discount reaches among low-income households and those with high energy costs"
        description="Each bar below is one group of households, such as those in poverty. The bar is split by how households in that group fare under the option: the dark teal part receives the discount because it gets a means-tested benefit, the light teal part qualifies through the income test alone, and the grey part gets nothing."
      />
      <Legend
        items={[
          { label: "Passported by a means-tested benefit", color: series.a },
          { label: "Qualifies through the income test alone", color: series.b },
          { label: "Gets nothing", color: series.neutral },
        ]}
      />
      <div className="space-y-5">
        {result.coverage.map((c) => {
          const passport = c.covered_by_passport;
          const incomeOnly = Math.max(c.covered - passport, 0);
          const missed = Math.max(1 - c.covered, 0);
          return (
            <div key={c.group}>
              <p className="mb-2 text-sm font-semibold text-slate-800">
                {COVERAGE_LABELS[c.group] ?? c.group} ({formatMillions(c.households_m)}):{" "}
                {formatMillions(c.missed_m, 2)} get nothing
              </p>
              <SplitBar
                segments={[
                  { key: "p", label: "Passported", value: passport, color: series.a },
                  { key: "i", label: "Income test alone", value: incomeOnly, color: series.b },
                  { key: "n", label: "Gets nothing", value: missed, color: series.neutral },
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
  const rows = (by === "region" ? result.by_region : result.by_household_type).map((r) => ({
    ...r,
    key: r.group,
    income_only_rate: Math.max(r.eligible_rate - r.passported_rate, 0),
  }));
  return (
    <section className="section-card space-y-5">
      <SectionHeading
        title="By region and household type"
        description="Share of households eligible through a benefit or through the income test alone, then cost, gains and the households in poverty the option does not reach. In poverty: households in absolute poverty after housing costs. ESS: effective sample size; small groups rest on few survey records."
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
          <div key={r.group} className="grid grid-cols-[minmax(0,180px)_1fr] items-center gap-3">
            <span className="text-sm text-slate-700">{r.group}</span>
            <SplitBar
              segments={[
                { key: "p", label: "Passported", value: r.passported_rate, color: series.a },
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
      <TableToggle>
        <Table
          minWidth={1180}
          columns={[
            { key: "group", header: by === "region" ? "Region" : "Household type" },
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
              key: "abs_ahc_poor_covered",
              header: "In poverty, reached",
              align: "right",
              format: (v) => formatShare(v),
            },
            {
              key: "abs_ahc_poor_missed_k",
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

function ThresholdSection({ result }) {
  if (!result.cliffs.length) {
    return (
      <section className="section-card">
        <SectionHeading
          title="Income cut-offs"
          description="This option has no income test, so no household gains or loses support by crossing an income line."
        />
      </section>
    );
  }
  return result.cliffs.map((c) => {
    const b = c.bands;
    const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
    const rows = [
      {
        group: `${gbp(c.threshold - 1000)} to ${gbp(c.threshold - 1)}`,
        households: b["1000_below"].households_k,
        lowest: b["1000_below"].bottom4_k,
      },
      {
        group: `${gbp(c.threshold)} to ${gbp(c.threshold + 999)}`,
        households: b["1000_above"].households_k,
        lowest: b["1000_above"].bottom4_k,
      },
    ];
    return (
      <section key={c.threshold} className="section-card space-y-4">
        <SectionHeading
          title={`The ${gbp(c.threshold)} cut-off`}
          description={`Households not on a passporting benefit whose tested income is within £1,000 of the line. Crossing it lowers support by ${formatCurrency(c.mean_drop)} on average for households just above.`}
        />
        {b["1000_above"].ess < THIN_ESS && (
          <Warning>
            The effective sample within £1,000 above this line is {Math.round(b["1000_above"].ess)}{" "}
            households in this dataset, so these figures are shown for completeness; the written
            analysis quotes Microcosm&apos;s.
          </Warning>
        )}
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Households within £1,000 above"
            value={formatThousands(b["1000_above"].households_k)}
          />
          <MetricCard
            label="…of which in the four lowest income deciles"
            value={formatThousands(b["1000_above"].bottom4_k)}
            note={`${formatThousands(b["1000_above"].rel_ahc_poor_k)} in relative poverty after housing costs.`}
          />
          <MetricCard
            label="Households in the dead zone"
            value={formatThousands(c.dead_zone_k)}
            note={`Median width ${formatCurrency(c.dead_zone_median_width)} of extra income.`}
          />
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer>
            <BarChart
              layout="vertical"
              data={rows}
              margin={{ top: 10, right: 56, bottom: 10, left: 4 }}
              barGap={2}
              barCategoryGap={14}
            >
              <CartesianGrid {...GRID_STYLE} horizontal={false} />
              <XAxis
                type="number"
                tick={AXIS_STYLE}
                tickFormatter={formatThousands}
                tickLine={false}
                axisLine={{ stroke: colors.border.light }}
              />
              <YAxis
                type="category"
                dataKey="group"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={{ stroke: colors.border.light }}
                width={150}
              />
              <Tooltip
                contentStyle={TOOLTIP_CONTAINER_STYLE}
                formatter={(v, name) => [formatThousands(v), name]}
              />
              <Bar
                dataKey="households"
                name="Households not passported"
                fill={series.a}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="households"
                  position="right"
                  formatter={formatThousands}
                  style={{ fontSize: 12, fill: colors.gray[700] }}
                />
              </Bar>
              <Bar
                dataKey="lowest"
                name="Of which in the four lowest income deciles"
                fill={series.b}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="lowest"
                  position="right"
                  formatter={formatThousands}
                  style={{ fontSize: 12, fill: colors.gray[700] }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Legend
          items={[
            { label: "Households not passported", color: series.a },
            { label: "Of which in the four lowest income deciles", color: series.b },
          ]}
        />
        <ChartLogo />
        <p className="text-xs leading-5 text-slate-500">
          The dead zone is the income range just above the line where the household&apos;s top
          earner would need more extra gross pay than the support lost to break even: 20% income tax
          plus 8% National Insurance, or 20% for a top earner over State Pension age. Effective
          sample size within £1,000 above: {Math.round(b["1000_above"].ess)}.
        </p>
      </section>
    );
  });
}

export default function ReformTab({ data, dataset }) {
  const [state, setFullState] = useState({
    preset: "rf_flat",
    variant: "published",
    year: data.meta.years[0],
  });
  const setState = (patch) => setFullState((s) => ({ ...s, ...patch }));
  const result = getResult(data, state.year, state.preset, state.variant, dataset);
  const published = getResult(data, state.year, state.preset, "published", dataset);
  const efrs = data.results[state.year]?.rf_flat?.efrs_1573?.headline.gb_households_m;
  const micro = data.results[state.year]?.rf_flat?.microcosm_979?.headline.gb_households_m;
  const levels =
    dataset === "efrs_1573" && efrs && micro
      ? `; Enhanced FRS counts run ${formatShare(efrs / micro - 1)} above Microcosm's.`
      : ".";

  return (
    <div className="space-y-6">
      <Controls
        data={data}
        state={state}
        setState={setState}
        result={result}
        published={published}
        dataset={dataset}
      />
      {!result ? (
        <p className="section-card text-sm text-slate-500">No results for this combination.</p>
      ) : (
        <>
          <Headline result={result} levels={levels} />
          <div className="pt-2">
            <SectionHeading
              size="lg"
              title="Distributional impact"
              description={`${data.meta.presets[state.preset]}, ${data.meta.variants[state.variant]}, ${yearLabel(data, state.year)}${dataset === DEFAULT_DATASET ? "" : `, ${DATASET_SHORT[dataset]}`}.`}
            />
          </div>
          <DecileSection result={result} />
          <WinnersSection result={result} />
          <InequalitySection result={result} />
          <PovertySection result={result} />
          <div className="pt-2">
            <SectionHeading size="lg" title="Reach and targeting" />
          </div>
          <ReachSection result={result} isPassportOnly={!result.schedule.income_test} />
          <BreakdownSection result={result} />
          <div className="pt-2">
            <SectionHeading
              size="lg"
              title="Income cut-offs"
              description="Support stops (or drops a tier) as soon as tested income reaches a line, so households just above a line lose the whole amount."
            />
          </div>
          <ThresholdSection result={result} />
        </>
      )}
    </div>
  );
}
