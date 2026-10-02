"use client";

import { pe } from "../lib/colors";
import { DATASET_SHORT } from "../lib/dataHelpers";
import { formatBn, formatCurrency, formatShare, formatThousands } from "../lib/formatters";
import SectionHeading from "./SectionHeading";
import { Table, TableToggle } from "./ui";

function formatFigure(value, unit) {
  if (value === null || value === undefined) return "n/a";
  if (unit === "share") return formatShare(value);
  if (unit === "gbp") return formatCurrency(value);
  if (unit === "millions") return `${Number(value).toFixed(1)}m`;
  if (unit === "thousands") return formatThousands(value);
  return String(value);
}

const TICKS = [0, 0.25, 0.5, 0.75, 1];
const RF_MARKER = { background: pe.ink };
const PE_MARKER = { background: pe.chart1, border: "2px solid #FFFFFF" };

function Gridlines() {
  return TICKS.map((t) => (
    <div
      key={t}
      aria-hidden
      className="absolute inset-y-0 w-px bg-slate-200"
      style={{ left: `${100 * t}%` }}
    />
  ));
}

/** Dot plot of shares on a 0–100% axis, with the Resolution Foundation beside PolicyEngine. */
function DotPlot({ rows }) {
  const cols = "md:grid-cols-[minmax(0,2.2fr)_minmax(0,2.4fr)_64px_64px_64px]";
  return (
    <div className="space-y-3">
      <div className={`hidden gap-4 border-b border-slate-200 pb-2 text-xs font-semibold text-slate-500 md:grid ${cols}`}>
        <span>Figure</span>
        <span className="relative h-4">
          {TICKS.map((t) => (
            <span
              key={t}
              className={`absolute ${t === 0 ? "" : t === 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: `${100 * t}%` }}
            >
              {formatShare(t)}
            </span>
          ))}
        </span>
        <span className="text-right">RF</span>
        <span className="text-right">PE</span>
        <span className="text-right">Gap</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => {
          const gap = row.value != null ? Math.round(100 * (row.value - row.rf)) : null;
          const lo = Math.min(row.rf, row.value ?? row.rf);
          const hi = Math.max(row.rf, row.value ?? row.rf);
          return (
            <div key={row.label} className={`grid items-center gap-2 py-2.5 md:gap-4 ${cols}`}>
              <div className="text-sm leading-5 text-slate-800">{row.label}</div>
              <div className="relative h-6">
                <Gridlines />
                <span
                  aria-hidden
                  className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-slate-300"
                  style={{ left: `${100 * lo}%`, width: `${100 * (hi - lo)}%` }}
                />
                <span
                  title={`Resolution Foundation: ${formatShare(row.rf)}`}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45"
                  style={{ left: `${100 * row.rf}%`, ...RF_MARKER }}
                />
                {row.value != null && (
                  <span
                    title={`PolicyEngine: ${formatShare(row.value)}`}
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                    style={{ left: `${100 * row.value}%`, ...PE_MARKER }}
                  />
                )}
              </div>
              <div className="flex gap-4 text-sm tabular-nums md:contents">
                <span className="md:text-right">
                  <span className="text-slate-500 md:hidden">RF </span>
                  {formatShare(row.rf)}
                </span>
                <span className="md:text-right">
                  <span className="text-slate-500 md:hidden">PE </span>
                  {row.value != null ? formatShare(row.value) : "n/a"}
                </span>
                <span
                  className={`font-semibold md:text-right ${
                    gap == null || Math.abs(gap) < 5 ? "text-slate-500" : "text-amber-700"
                  }`}
                >
                  {gap == null ? "" : `${gap > 0 ? "+" : gap < 0 ? "−" : ""}${Math.abs(gap)}pp`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="legend-box">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45" style={RF_MARKER} />
          Resolution Foundation
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={PE_MARKER} />
          PolicyEngine
        </span>
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Each row is a share of the group it names, 2024-25. Gap is PolicyEngine minus the
        Resolution Foundation in percentage points; gaps of 5 points or more are highlighted.
      </p>
    </div>
  );
}

export default function ReportComparison({ data, dataset }) {
  const rf = data.rf_comparison;
  const years = Object.keys(rf.figures[0]?.policyengine?.[dataset] ?? {});
  const dotRows = rf.figures
    .filter((f) => f.unit === "share" && f.rf != null)
    .map((f) => ({ label: f.label, rf: f.rf, value: f.policyengine[dataset]?.["2024"] }));
  const rows = rf.figures.map((f) => {
    const row = {
      key: f.id,
      figure: f.label,
      rf: f.rf == null ? "not published" : `${formatFigure(f.rf, f.unit)} (p. ${f.page})`,
    };
    for (const y of years) row[y] = formatFigure(f.policyengine[dataset]?.[y], f.unit);
    return row;
  });
  const yearName = (y) => (y === "2024" ? "2024-25" : (data.meta.year_labels?.[y] ?? y));
  const extra = rf.extra?.[dataset]?.["2024"];
  const short = DATASET_SHORT[dataset];
  return (
    <section className="section-card space-y-4">
        <SectionHeading
          title="Comparison with the Resolution Foundation's figures"
          description={
            <>
              The report (
              <a href={data.meta.rf.url} target="_blank" rel="noreferrer" className="underline">
                {data.meta.rf.authors}, {data.meta.rf.date}
              </a>
              ) uses the Family Resources Survey 2024-25 for Great Britain with the IPPR tax-benefit
              model. PolicyEngine&apos;s like-for-like estimates use 2024-25 incomes; the
              scheme-year column shows how the figures move with incomes.
            </>
          }
        />
      <div className="subsection space-y-4">
        <SectionHeading
          title="Shares of households, 2024-25"
          description="Each row is one share the report publishes, on a 0–100% scale. Shares count the income test alone; passporting is shown in its own rows."
        />
        <DotPlot rows={dotRows} />
        <div className="chart-footer">
        <TableToggle label="Show every figure the report publishes">
          <Table
            minWidth={760}
            columns={[
              { key: "figure", header: "Figure" },
              { key: "rf", header: "Resolution Foundation", align: "right" },
              ...years.map((y) => ({
                key: y,
                header: `PolicyEngine, ${yearName(y)}`,
                align: "right",
              })),
            ]}
            rows={rows}
          />
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            {rf.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
            {extra && (
              <li>
                2024-25: at the report&apos;s amounts the flat option costs{" "}
                {formatBn(extra.cost_flat_at_175_bn)} and the tiered option{" "}
                {formatBn(extra.cost_tiered_at_220_85_bn)} (
                {formatBn(extra.cost_tiered_own_income_at_220_85_bn)} with passported households
                tiered on their own income){dataset === "microcosm_979" ? "" : ` (${short})`}.
              </li>
            )}
          </ul>
        </TableToggle>
        </div>
      </div>
    </section>
  );
}

/** Report statements the microdata cannot test; shown in the methodology. */
export function NotReproduced({ data }) {
  return (
    <div className="space-y-2">
      <p>
        <strong>Figures this analysis does not reproduce.</strong> Statements in the Resolution
        Foundation&apos;s report that the survey data cannot test, and the proxy used instead where
        there is one.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        {data.rf_comparison.not_modelled.map((n) => (
          <li key={n.rf_statement}>
            {n.rf_statement} (p. {n.page}). {n.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
