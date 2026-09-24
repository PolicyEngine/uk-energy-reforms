"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DecileRow } from "@/lib/data";
import { gbp, pct, thousands } from "@/lib/format";

// Validated pair (dataviz validator: all checks pass on the light surface):
// teal-400 #38B2AC and chart-4 #026AA2. Teal-400 is below 3:1 contrast, so every
// chart carries visible labels or a table view. RF reference values use ink.
export const SERIES_A = "var(--color-teal-400)";
export const SERIES_B = "var(--chart-4)";
export const NEUTRAL = "var(--color-gray-300)";
export const INK = "var(--foreground)";

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 };

// Legend entries keep the stacking order and wear text ink, not the series colour.
const LEGEND_ORDER = ["passported", "incomeOnly", "notReached", "households", "poorest"];
const legendOrder = (item: { dataKey?: unknown }) =>
  LEGEND_ORDER.indexOf(String(item.dataKey));
const legendText = (value: string) => (
  <span style={{ color: "var(--foreground)" }}>{value}</span>
);

export function DecileChart({ rows }: { rows: DecileRow[] }) {
  const data = rows.map((r) => ({ ...r, label: String(r.decile) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 24, right: 8, bottom: 24, left: 8 }}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          label={{
            value: "Income decile (after housing costs, poorest to richest)",
            position: "insideBottom",
            offset: -14,
            fill: "var(--muted-foreground)",
            fontSize: 12,
          }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => gbp(v)}
          niceTicks="snap125"
          domain={[0, "auto"]}
          width={56}
        />
        <Tooltip
          separator=": "
          cursor={{ fill: "var(--muted)" }}
          formatter={(v) => [gbp(Number(v)), "Average gain per household"]}
          labelFormatter={(l) => `Decile ${l}`}
        />
        <Bar dataKey="average_gain" fill={SERIES_A} radius={[4, 4, 0, 0]} maxBarSize={36}>
          <LabelList
            dataKey="average_gain"
            position="top"
            formatter={(v) => gbp(Number(v))}
            style={{ fill: "var(--foreground)", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface ShareRow {
  group: string;
  passported: number;
  incomeOnly: number;
  notReached: number;
}

/** Horizontal 100% bars: passported, income test only, not reached. */
export function ShareBars({
  rows,
  notReachedLabel = "Not reached",
}: {
  rows: ShareRow[];
  notReachedLabel?: string;
}) {
  const height = 44 + rows.length * 34;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ top: 8, right: 48, bottom: 8, left: 8 }}
        barCategoryGap={8}
      >
        <CartesianGrid stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v: number) => pct(v)}
          tick={axisTick}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="group"
          width={190}
          tick={{ ...axisTick, fill: "var(--foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          separator=": "
          cursor={{ fill: "var(--muted)" }}
          formatter={(v, name) => [pct(Number(v)), name]}
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="square"
          wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
          itemSorter={legendOrder}
          formatter={legendText}
        />
        <Bar
          dataKey="passported"
          name="Passported by a benefit"
          stackId="s"
          fill={SERIES_A}
          stroke="var(--background)"
          strokeWidth={2}
        />
        <Bar
          dataKey="incomeOnly"
          name="Income test only"
          stackId="s"
          fill={SERIES_B}
          stroke="var(--background)"
          strokeWidth={2}
        >
          <LabelList
            position="right"
            valueAccessor={(entry: { payload?: ShareRow }) =>
              entry.payload ? entry.payload.passported + entry.payload.incomeOnly : 0
            }
            formatter={(v) => pct(Number(v))}
            style={{ fill: "var(--foreground)", fontSize: 11 }}
          />
        </Bar>
        <Bar
          dataKey="notReached"
          name={notReachedLabel}
          stackId="s"
          fill={NEUTRAL}
          stroke="var(--background)"
          strokeWidth={2}
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface BandRow {
  band: string;
  households: number;
  poorest: number;
}

/** Households either side of a threshold, and how many are in the poorest four deciles. */
export function BandChart({ rows }: { rows: BandRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={rows} margin={{ top: 24, right: 8, bottom: 8, left: 8 }} barGap={2}>
        <CartesianGrid stroke="var(--border)" vertical={false} />
        <XAxis
          dataKey="band"
          tick={axisTick}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
        />
        <YAxis
          tick={axisTick}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => thousands(v)}
          niceTicks="snap125"
          domain={[0, "auto"]}
          width={48}
        />
        <Tooltip
          separator=": "
          cursor={{ fill: "var(--muted)" }}
          formatter={(v, name) => [thousands(Number(v)), name]}
        />
        <Legend
          verticalAlign="top"
          align="left"
          iconType="square"
          wrapperStyle={{ fontSize: 12, paddingBottom: 8 }}
          itemSorter={legendOrder}
          formatter={legendText}
        />
        <Bar
          dataKey="households"
          name="Non-passported households"
          fill={SERIES_A}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        >
          <LabelList
            dataKey="households"
            position="top"
            formatter={(v) => thousands(Number(v))}
            style={{ fill: "var(--foreground)", fontSize: 11 }}
          />
        </Bar>
        <Bar
          dataKey="poorest"
          name="Of which in the poorest four deciles"
          fill={SERIES_B}
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        >
          <LabelList
            dataKey="poorest"
            position="top"
            formatter={(v) => thousands(Number(v))}
            style={{ fill: "var(--foreground)", fontSize: 11 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface DotRow {
  label: string;
  rf: number;
  values: { key: string; name: string; value: number }[];
}

/**
 * RF's figure (ink diamond) beside PolicyEngine's estimates (circles) on a shared
 * 0-100% track. Values are also printed, so identity never rests on colour alone.
 */
export function DotPlot({ rows, names }: { rows: DotRow[]; names: string[] }) {
  const marker = (i: number) =>
    i === 0
      ? { background: SERIES_A, border: `2px solid ${SERIES_A}` }
      : { background: "var(--background)", border: `2px solid ${SERIES_B}` };
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rotate-45"
            style={{ background: INK }}
          />
          Resolution Foundation
        </span>
        {names.map((n, i) => (
          <span key={n} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={marker(i)} />
            PolicyEngine, {n}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid grid-cols-1 gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-4">
          <div className="text-sm text-foreground">{row.label}</div>
          <div>
            <div className="relative h-6">
              <div className="absolute top-1/2 h-px w-full bg-border" />
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div
                  key={t}
                  className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-border"
                  style={{ left: `${100 * t}%` }}
                />
              ))}
              <span
                title={`Resolution Foundation: ${pct(row.rf)}`}
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45"
                style={{ left: `${100 * row.rf}%`, background: INK }}
              />
              {row.values.map((v, i) => (
                <span
                  key={v.key}
                  title={`PolicyEngine, ${v.name}: ${pct(v.value)}`}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${100 * v.value}%`, ...marker(i) }}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              RF {pct(row.rf)} ·{" "}
              {row.values.map((v) => `${v.name} ${pct(v.value)}`).join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
