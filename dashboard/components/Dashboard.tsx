"use client";

// Subpath imports: in ui-kit 0.4.0 the root index re-exports resolve to untyped
// bundles under TypeScript's bundler resolution; the subpaths carry their types.
import { DataTable, MetricCard } from "@policyengine/ui-kit/display";
import { SelectInput } from "@policyengine/ui-kit/inputs";
import { Footer, Header } from "@policyengine/ui-kit/layout";
import {
  SegmentedControl,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@policyengine/ui-kit/primitives";
import { useMemo, useState } from "react";

import { BandChart, DecileChart, DotPlot, ShareBars } from "@/components/charts";
import {
  DATASET_ORDER,
  DATASET_SHORT,
  type BreakdownRow,
  type Result,
  type Schedule,
  data,
  scenarioId,
} from "@/lib/data";
import {
  POVERTY_GROUPS,
  POVERTY_MEASURES,
  formatRf,
  gbp,
  gbpBn,
  millions,
  pct,
  signedPp,
  signedThousands,
  thousands,
} from "@/lib/format";

const NAV = [
  { label: "Research", href: "https://policyengine.org/uk/research" },
  { label: "Model", href: "https://policyengine.org/uk/model" },
  { label: "About", href: "https://policyengine.org/uk/about" },
];

const PRESET_ORDER = [
  "rf_flat",
  "rf_tiered",
  "rf_tiered_own_income",
  "rf_household_income",
  "passport_only",
];

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function TableView({ children }: { children: React.ReactNode }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-muted-foreground">View as table</summary>
      <div className="mt-2 overflow-x-auto">{children}</div>
    </details>
  );
}

function describeSchedule(s: Schedule): string {
  const [, t1, t2] = s.thresholds;
  const test = s.household_equivalised
    ? "equivalised household income"
    : "highest individual taxable income";
  if (!s.income_test) {
    return "Passported households only; no income test.";
  }
  const band = (a: number, r: number) =>
    s.bill_share ? `${pct(r, 1)} off the annual gas and electricity bill` : gbp(a);
  const parts =
    s.amounts[0] === s.amounts[1] && s.rates[0] === s.rates[1]
      ? [`${band(s.amounts[0], s.rates[0])} where ${test} is below ${gbp(t2)}`]
      : [
          `${band(s.amounts[0], s.rates[0])} below ${gbp(t1)}`,
          `${band(s.amounts[1], s.rates[1])} from ${gbp(t1)} to ${gbp(t2)} (${test})`,
        ];
  const passport =
    s.passport_assessed_income === 0
      ? "passported households receive the first tier"
      : "passported households are tiered on their own income, with the second tier as the floor";
  return `${parts.join("; ")}; ${passport}.`;
}

function breakdownColumns(groupHeader: string) {
  return [
    { key: "group", header: groupHeader },
    { key: "households_m", header: "Households", align: "right" as const, format: (v: unknown) => millions(Number(v)) },
    { key: "eligible_rate", header: "Eligible", align: "right" as const, format: (v: unknown) => pct(Number(v)) },
    { key: "cost_share", header: "Share of cost", align: "right" as const, format: (v: unknown) => pct(Number(v), 1) },
    { key: "average_per_recipient", header: "Avg per recipient", align: "right" as const, format: (v: unknown) => gbp(Number(v)) },
    { key: "gain_pct_net_income", header: "Gain, % income", align: "right" as const, format: (v: unknown) => pct(Number(v), 2) },
    { key: "abs_ahc_poor_covered", header: "Poor reached", align: "right" as const, format: (v: unknown) => pct(Number(v)) },
    { key: "abs_ahc_poor_missed_k", header: "Poor not reached", align: "right" as const, format: (v: unknown) => thousands(Number(v)) },
    { key: "bottom4_missed_k", header: "Poorest 40% not reached", align: "right" as const, format: (v: unknown) => thousands(Number(v)) },
    { key: "people_out_of_rel_ahc_poverty_k", header: "People out of rel. poverty", align: "right" as const, format: (v: unknown) => thousands(Number(v)) },
    { key: "ess", header: "ESS", align: "right" as const, format: (v: unknown) => Math.round(Number(v)).toLocaleString("en-GB") },
  ];
}

function shareRows(rows: BreakdownRow[]) {
  return rows.map((r) => ({
    group: r.group,
    passported: r.passported_rate,
    incomeOnly: Math.max(r.eligible_rate - r.passported_rate, 0),
    notReached: Math.max(1 - r.eligible_rate, 0),
  }));
}

function Breakdown({ rows, groupHeader }: { rows: BreakdownRow[]; groupHeader: string }) {
  return (
    <>
      <Section
        title="Who is eligible"
        subtitle="Share of households eligible through a passporting benefit or through the income test alone."
      >
        <ShareBars rows={shareRows(rows)} notReachedLabel="Not eligible" />
      </Section>
      <Section
        title="Cost, gains and households not reached"
        subtitle="Poor: households in absolute poverty after housing costs (the 2010-11 HBAI line uprated by CPI). Poorest 40%: households in the poorest four income deciles after housing costs. People out of relative poverty: change in people below 60% of the baseline median after housing costs. ESS: effective sample size; small groups rest on few survey records."
      >
        <div className="overflow-x-auto">
          <DataTable
            columns={breakdownColumns(groupHeader)}
            data={rows as unknown as Record<string, unknown>[]}
            styles={{ table: { minWidth: 1040 } }}
          />
        </div>
      </Section>
    </>
  );
}

function Overview({ result, dataset }: { result: Result; dataset: string }) {
  const h = result.headline;
  const rel = result.poverty.find((p) => p.measure === "rel_pov_ahc" && p.group === "people");
  const relKids = result.poverty.find((p) => p.measure === "rel_pov_ahc" && p.group === "children");
  const coverage = result.coverage.map((c) => ({
    group: c.group.charAt(0).toUpperCase() + c.group.slice(1),
    passported: c.covered_by_passport,
    incomeOnly: Math.max(c.covered - c.covered_by_passport, 0),
    notReached: Math.max(1 - c.covered, 0),
  }));
  return (
    <>
      {dataset === "efrs_1573" && (
        <p className="text-sm text-muted-foreground">
          Enhanced FRS weights sum to {millions(h.gb_households_m, 1)} GB households, about
          7-10% more than Microcosm and the report, so its counts run high; shares are
          comparable.
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Cost in 2026-27" value={gbpBn(h.cost_bn)} />
        <MetricCard
          label="Households receiving support"
          value={millions(h.recipients_m)}
          delta={`${pct(h.recipient_share, 1)} of GB households`}
          trend="neutral"
        />
        <MetricCard label="Average per receiving household" value={gbp(h.average_per_recipient)} />
        <MetricCard
          label="People in relative poverty (AHC)"
          value={rel ? signedThousands(rel.change_k) : "n/a"}
          delta={relKids ? `${signedThousands(relKids.change_k)} children` : undefined}
          trend="neutral"
        />
      </div>
      <Section
        title="Average gain by income decile"
        subtitle="Average change in household net income, across all households in each decile (receiving or not). Deciles rank people by equivalised income after housing costs."
      >
        <DecileChart rows={result.deciles} />
        <TableView>
          <DataTable
            columns={[
              { key: "decile", header: "Decile" },
              { key: "share_receiving", header: "Share receiving", align: "right", format: (v) => pct(Number(v)) },
              { key: "average_gain", header: "Average gain", align: "right", format: (v) => gbp(Number(v)) },
              { key: "gain_pct_net_income", header: "Gain, % of net income", align: "right", format: (v) => pct(Number(v), 2) },
            ]}
            data={result.deciles as unknown as Record<string, unknown>[]}
          />
        </TableView>
      </Section>
      <Section
        title="Households the scheme reaches"
        subtitle="Share of each group of households reached through passporting or through the income test alone. Energy spend above 10% of net income is the pre-2011 fuel poverty test."
      >
        <ShareBars rows={coverage} />
        <TableView>
          <DataTable
            columns={[
              { key: "group", header: "Group" },
              { key: "households_m", header: "Households", align: "right", format: (v) => millions(Number(v)) },
              { key: "covered_by_passport", header: "Passported", align: "right", format: (v) => pct(Number(v)) },
              { key: "covered", header: "Reached", align: "right", format: (v) => pct(Number(v)) },
              { key: "missed_m", header: "Not reached", align: "right", format: (v) => millions(Number(v)) },
            ]}
            data={result.coverage as unknown as Record<string, unknown>[]}
          />
        </TableView>
      </Section>
      <Section
        title="Poverty"
        subtitle="Change in the number of people in poverty, counting the discount as household income (as DWP counts the Warm Home Discount)."
      >
        <div className="overflow-x-auto">
          <DataTable
            columns={[
              { key: "measure", header: "Measure", format: (v) => POVERTY_MEASURES[String(v)] ?? String(v) },
              { key: "group", header: "Group", format: (v) => POVERTY_GROUPS[String(v)] ?? String(v) },
              { key: "baseline_rate", header: "Baseline rate", align: "right", format: (v) => pct(Number(v), 1) },
              { key: "change_pp", header: "Change", align: "right", format: (v) => signedPp(Number(v)) },
              { key: "change_k", header: "Change in people", align: "right", format: (v) => signedThousands(Number(v)) },
            ]}
            data={result.poverty as unknown as Record<string, unknown>[]}
          />
        </div>
      </Section>
    </>
  );
}

function Thresholds({ result, dataset }: { result: Result; dataset: string }) {
  if (result.cliffs.length === 0) {
    return (
      <Section title="Income thresholds">
        <p className="text-sm text-muted-foreground">
          This option has no income test, so no household gains or loses support by crossing an
          income threshold.
        </p>
      </Section>
    );
  }
  return (
    <>
      {dataset === "efrs_1573" && (
        <p className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
          The Enhanced FRS puts an effective sample of about 10 households within £1,000 of
          each line, so these band figures are shown for completeness only; the written
          analysis quotes Microcosm&apos;s.
        </p>
      )}
      {result.cliffs.map((c) => {
        const b = c.bands;
        const rows = [
          {
            band: `${gbp(c.threshold - 1000)} to ${gbp(c.threshold - 1)}`,
            households: b["1000_below"].households_k,
            poorest: b["1000_below"].bottom4_k,
          },
          {
            band: `${gbp(c.threshold)} to ${gbp(c.threshold + 999)}`,
            households: b["1000_above"].households_k,
            poorest: b["1000_above"].bottom4_k,
          },
        ];
        return (
          <Section
            key={c.threshold}
            title={`The ${gbp(c.threshold)} threshold`}
            subtitle={`Non-passported households whose tested income is within £1,000 of the line. Crossing it lowers support by ${gbp(c.mean_drop)} on average for households just above.`}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <MetricCard label="Households within £1,000 above" value={thousands(b["1000_above"].households_k)} />
              <MetricCard
                label="…of which in the poorest four deciles"
                value={thousands(b["1000_above"].bottom4_k)}
                delta={`${thousands(b["1000_above"].rel_ahc_poor_k)} in relative AHC poverty`}
                trend="neutral"
              />
              <MetricCard
                label="Households in the dead zone"
                value={thousands(c.dead_zone_k)}
                delta={`median width ${gbp(c.dead_zone_median_width)}`}
                trend="neutral"
              />
            </div>
            <BandChart rows={rows} />
            <p className="text-xs text-muted-foreground">
              The dead zone is the income range just above the threshold where the
              household&apos;s top earner would need more extra gross pay than the support lost
              to break even, at 20% income tax plus 8% National Insurance (20% for top earners
              over State Pension age). Effective sample size within £1,000 above:{" "}
              {Math.round(b["1000_above"].ess)}; treat band counts as indicative.
            </p>
          </Section>
        );
      })}
    </>
  );
}

function RfComparison() {
  const rf = data.rf_comparison;
  const shares = rf.figures.filter((f) => f.unit === "share");
  const names = DATASET_ORDER.map((d) => DATASET_SHORT[d] ?? d);
  const dotRows = shares.map((f) => ({
    label: f.label,
    rf: f.rf,
    values: DATASET_ORDER.map((d) => ({
      key: d,
      name: DATASET_SHORT[d] ?? d,
      value: f.policyengine[d]?.["2024"],
    })).filter((v) => v.value !== undefined),
  }));
  const tableRows = rf.figures.map((f) => {
    const row: Record<string, unknown> = {
      figure: f.label,
      rf: `${formatRf(f.rf, f.unit)} (p. ${f.page})`,
      statement: f.rf_statement,
    };
    for (const d of DATASET_ORDER) {
      for (const y of ["2024", "2026"]) {
        row[`${d}_${y}`] = formatRf(f.policyengine[d]?.[y], f.unit);
      }
    }
    return row;
  });
  const columns = [
    { key: "figure", header: "Figure" },
    { key: "rf", header: "Resolution Foundation", align: "right" as const },
    ...DATASET_ORDER.flatMap((d) =>
      ["2024", "2026"].map((y) => ({
        key: `${d}_${y}`,
        header: `${DATASET_SHORT[d] ?? d}, ${y === "2024" ? "2024-25" : "2026-27"}`,
        align: "right" as const,
      })),
    ),
  ];
  const extra = rf.extra;
  return (
    <>
      <Section
        title="Shares of households: PolicyEngine beside the Resolution Foundation"
        subtitle="PolicyEngine estimates use 2024-25 incomes, the year of the Family Resources Survey the Resolution Foundation analyses. Shares count the income test alone; passporting is shown separately."
      >
        <DotPlot rows={dotRows} names={names} />
      </Section>
      <Section
        title="All published figures"
        subtitle="The Resolution Foundation column restates each figure with its page in the report. PolicyEngine columns show 2024-25 (like for like) and 2026-27 (the scheme year)."
      >
        <div className="overflow-x-auto">
          <DataTable columns={columns} data={tableRows} />
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {rf.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {DATASET_ORDER.map((d) => {
            const e = extra[d]?.["2024"];
            if (!e) return null;
            return (
              <li key={d}>
                {DATASET_SHORT[d] ?? d}, 2024-25: at RF&apos;s amounts the flat option costs{" "}
                {gbpBn(e.cost_flat_at_175_bn)} and the tiered option{" "}
                {gbpBn(e.cost_tiered_at_220_85_bn)} ({gbpBn(e.cost_tiered_own_income_at_220_85_bn)}{" "}
                with passported households tiered on their own income, which rescales to{" "}
                {gbp(e.tiered_low_at_budget_own_income)} and {gbp(e.tiered_high_at_budget_own_income)} at
                £2bn).
              </li>
            );
          })}
        </ul>
      </Section>
      <Section title="Figures this analysis does not reproduce">
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          {rf.not_modelled.map((n) => (
            <li key={n.rf_statement}>
              {n.rf_statement} (p. {n.page}). {n.reason}
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function Methodology() {
  const m = data.meta;
  return (
    <Section title="Methodology">
      <ul className="list-disc space-y-2 pl-5 text-sm text-foreground">
        <li>
          Estimates come from static microsimulation with PolicyEngine UK (policyengine-uk{" "}
          {m.policyengine_uk}) for Great Britain in 2026-27, with incomes uprated from the 2024-25
          survey year. Northern Ireland is excluded, as in the proposal.
        </li>
        <li>
          Eligibility: a household qualifies if it receives Universal Credit, Pension Credit,
          Housing Benefit, income-related ESA, income-based JSA or Income Support (as modelled,
          including take-up), or if the highest taxable income of any member (earnings, pensions
          including the State Pension, property, savings, dividends and taxable benefits) is below
          the threshold. Incomes are annual; the proposal assesses the three months before the
          scheme.
        </li>
        <li>
          Support: &quot;RF&apos;s amounts&quot; pays the report&apos;s averages to every eligible
          household. &quot;Scaled to £2bn&quot; scales them so the scheme costs £2bn.
          &quot;Bill share&quot; takes a percentage off each household&apos;s annual gas and
          electricity spend, set so the average matches the report&apos;s amounts. The
          report proposes a cut in unit prices (pence per kWh); the microdata hold annual
          spend, not kWh, so the bill share also discounts standing charges and gives
          low-consumption households relatively more than a per-kWh cut would. Every eligible
          household claims.
        </li>
        <li>
          The discount counts as household income in the HBAI measures, as DWP counts the Warm
          Home Discount. Relative poverty uses 60% of the baseline median, held fixed; absolute
          poverty uses the 2010-11 line uprated by CPI.
        </li>
        <li>
          Data: {DATASET_ORDER.map((d) => `${m.datasets[d].label}. ${m.datasets[d].notes}`).join(" ")}{" "}
          Neither dataset records prepayment meters, off-grid heating fuels, energy efficiency
          ratings or whether households can afford to keep warm.
        </li>
        <li>
          Levels differ between the datasets: the Enhanced FRS weights sum to{" "}
          {data.results.rf_flat?.efrs_1573?.headline.gb_households_m.toFixed(1)}m GB households
          in 2026-27, against{" "}
          {data.results.rf_flat?.microcosm_979?.headline.gb_households_m.toFixed(1)}m in
          Microcosm and about 28m in the report, so its counts run about 7-10% high. Shares
          and rates are comparable across datasets; counts are not.
        </li>
        <li>
          Dead zones gross the lost support up at the household top earner&apos;s marginal
          rate: 20% basic-rate income tax plus 8% employee National Insurance, or 20% where
          the top earner is over State Pension age.
        </li>
        <li>
          The two datasets weight household types differently (multi-family households are 21%
          of households in Microcosm and 9% in the Enhanced FRS), so counts by household type
          differ more than rates.
        </li>
        <li>
          Source proposal: {m.rf.authors}, &quot;{m.rf.title}&quot;, {m.rf.publisher},{" "}
          {m.rf.date}.{" "}
          <a className="text-primary underline" href={m.rf.url}>
            Read the report
          </a>
          . Code and full results:{" "}
          <a className="text-primary underline" href="https://github.com/PolicyEngine/uk-energy-reforms">
            github.com/PolicyEngine/uk-energy-reforms
          </a>
          .
        </li>
      </ul>
    </Section>
  );
}

export default function Dashboard() {
  const [preset, setPreset] = useState("rf_flat");
  const [variant, setVariant] = useState("published");
  const [dataset, setDataset] = useState(DATASET_ORDER[0]);

  const scenario = useMemo(
    () => data.scenarios.find((s) => s.id === scenarioId(preset, variant)),
    [preset, variant],
  );
  const result = data.results[scenarioId(preset, variant)]?.[dataset];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header navItems={NAV} logoHref="https://policyengine.org/uk" />
      <main className="mx-auto flex w-full max-w-content flex-col gap-6 px-4 py-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold text-foreground">Targeted energy discount</h1>
          <p className="max-w-3xl text-base text-foreground">
            The Resolution Foundation proposes discounting gas and electricity unit prices for
            households that receive a means-tested benefit or whose highest-income member has
            taxable income below £24,000 a year, with a tiered version paying about £220 below
            £18,000 and £85 from £18,000 to £24,000. This dashboard estimates who each option
            reaches, what it costs and how it changes household incomes in 2026-27, and sets
            PolicyEngine&apos;s estimates beside the report&apos;s own figures.
          </p>
          <p className="text-sm text-muted-foreground">
            Source:{" "}
            <a className="text-primary underline" href={data.meta.rf.url}>
              {data.meta.rf.publisher}, &quot;{data.meta.rf.title}&quot; ({data.meta.rf.date})
            </a>
            . Pre-computed results; last generated {data.meta.generated}.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted p-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div className="w-full min-w-64 sm:w-auto sm:flex-1">
            <SelectInput
              label="Option"
              value={preset}
              onChange={setPreset}
              options={PRESET_ORDER.filter((p) => data.results[p]).map((p) => ({
                value: p,
                label: data.meta.presets[p] ?? p,
              }))}
            />
            </div>
            <div className="flex min-w-0 max-w-full flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Support amounts</span>
              <div className="max-w-full overflow-x-auto">
              <SegmentedControl
                value={variant}
                onValueChange={setVariant}
                size="sm"
                options={Object.entries(data.meta.variants).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Data</span>
              <SegmentedControl
                value={dataset}
                onValueChange={setDataset}
                size="sm"
                options={DATASET_ORDER.map((d) => ({ value: d, label: DATASET_SHORT[d] ?? d }))}
              />
            </div>
          </div>
          {scenario && result && (
            <p className="text-sm text-muted-foreground">{describeSchedule(result.schedule)}</p>
          )}
        </div>

        {result ? (
          <Tabs defaultValue="overview" className="flex flex-col gap-4">
            <TabsList className="h-auto! w-full flex-wrap justify-start sm:w-fit">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="region">By region</TabsTrigger>
              <TabsTrigger value="household">By household type</TabsTrigger>
              <TabsTrigger value="thresholds">Income thresholds</TabsTrigger>
              <TabsTrigger value="rf">Comparison with the report</TabsTrigger>
              <TabsTrigger value="method">Methodology</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="flex flex-col gap-4">
              <Overview result={result} dataset={dataset} />
            </TabsContent>
            <TabsContent value="region" className="flex flex-col gap-4">
              <Breakdown rows={result.by_region} groupHeader="Region" />
            </TabsContent>
            <TabsContent value="household" className="flex flex-col gap-4">
              <Breakdown rows={result.by_household_type} groupHeader="Household type" />
            </TabsContent>
            <TabsContent value="thresholds" className="flex flex-col gap-4">
              <Thresholds result={result} dataset={dataset} />
            </TabsContent>
            <TabsContent value="rf" className="flex flex-col gap-4">
              <RfComparison />
            </TabsContent>
            <TabsContent value="method" className="flex flex-col gap-4">
              <Methodology />
            </TabsContent>
          </Tabs>
        ) : (
          <p className="text-sm text-muted-foreground">No results for this combination.</p>
        )}
      </main>
      <Footer />
    </div>
  );
}
