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
  const labelCol = "md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45" style={RF_MARKER} />
          Resolution Foundation
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full" style={PE_MARKER} />
          PolicyEngine
        </span>
      </div>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className={`grid gap-1 md:items-center md:gap-4 ${labelCol}`}>
            <div className="text-sm text-slate-800">{row.label}</div>
            <div>
              <div className="relative h-9">
                <Gridlines />
                <span
                  title={`Resolution Foundation: ${formatShare(row.rf)}`}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45"
                  style={{ left: `${100 * row.rf}%`, ...RF_MARKER }}
                />
                {row.value != null && (
                  <span
                    title={`PolicyEngine: ${formatShare(row.value)}`}
                    className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ left: `${100 * row.value}%`, ...PE_MARKER }}
                  />
                )}
              </div>
              <div className="text-xs text-slate-500">
                Resolution Foundation {formatShare(row.rf)} · PolicyEngine{" "}
                {row.value != null ? formatShare(row.value) : "n/a"}
              </div>
            </div>
          </div>
        ))}
        <div className={`grid gap-1 md:gap-4 ${labelCol}`}>
          <div className="hidden md:block" />
          <div>
            <div className="relative h-5">
              {TICKS.map((t) => (
                <span
                  key={t}
                  className="absolute -translate-x-1/2 text-xs text-slate-500"
                  style={{ left: `${100 * t}%` }}
                >
                  {formatShare(t)}
                </span>
              ))}
            </div>
            <p className="mt-1 text-center text-xs text-slate-500">
              Share of the group each row names, 2024-25
            </p>
          </div>
        </div>
      </div>
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
    <>
      <div className="pt-2">
        <SectionHeading
          size="lg"
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
      </div>
      <section className="section-card space-y-4">
        <SectionHeading
          title="Shares of households, 2024-25"
          description="Each row is one share the report publishes, on a 0–100% scale. Shares count the income test alone; passporting is shown in its own rows."
        />
        <DotPlot rows={dotRows} />
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
      </section>
      <section className="section-card">
        <SectionHeading title="Figures this analysis does not reproduce" />
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
          {rf.not_modelled.map((n) => (
            <li key={n.rf_statement}>
              {n.rf_statement} (p. {n.page}). {n.reason}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
