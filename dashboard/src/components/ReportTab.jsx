"use client";

import { series } from "../lib/colors";
import { DATASET_ORDER, DATASET_SHORT } from "../lib/dataHelpers";
import { formatBn, formatCurrency, formatShare, formatThousands } from "../lib/formatters";
import SectionHeading from "./SectionHeading";
import { Table } from "./ui";

function formatFigure(value, unit) {
  if (value === null || value === undefined) return "n/a";
  if (unit === "share") return formatShare(value);
  if (unit === "gbp") return formatCurrency(value);
  if (unit === "millions") return `${Number(value).toFixed(1)}m`;
  if (unit === "thousands") return formatThousands(value);
  return String(value);
}

const MARKERS = {
  microcosm_979: { background: series.a, border: `2px solid ${series.a}` },
  efrs_1573: { background: "#FFFFFF", border: `2px solid ${series.b}` },
};

function DotPlot({ rows, datasets }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-5 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-2.5 w-2.5 rotate-45" style={{ background: series.ink }} />
          Resolution Foundation
        </span>
        {datasets.map((d) => (
          <span key={d} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-full" style={MARKERS[d]} />
            PolicyEngine, {DATASET_SHORT[d]}
          </span>
        ))}
      </div>
      {rows.map((row) => (
        <div key={row.label} className="grid gap-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center md:gap-4">
          <div className="text-sm text-slate-800">{row.label}</div>
          <div>
            <div className="relative h-6">
              <div className="absolute top-1/2 h-px w-full bg-slate-200" />
              {[0, 0.25, 0.5, 0.75, 1].map((t) => (
                <div key={t} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-slate-200" style={{ left: `${100 * t}%` }} />
              ))}
              <span
                title={`Resolution Foundation: ${formatShare(row.rf)}`}
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45"
                style={{ left: `${100 * row.rf}%`, background: series.ink }}
              />
              {row.values.map((v) => (
                <span
                  key={v.dataset}
                  title={`PolicyEngine, ${DATASET_SHORT[v.dataset]}: ${formatShare(v.value)}`}
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ left: `${100 * v.value}%`, ...MARKERS[v.dataset] }}
                />
              ))}
            </div>
            <div className="text-xs text-slate-500">
              RF {formatShare(row.rf)} ·{" "}
              {row.values.map((v) => `${DATASET_SHORT[v.dataset]} ${formatShare(v.value)}`).join(" · ")}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ReportTab({ data }) {
  const rf = data.rf_comparison;
  const datasets = DATASET_ORDER.filter((d) => rf.figures[0]?.policyengine?.[d]);
  const years = Object.keys(rf.figures[0]?.policyengine?.[datasets[0]] ?? {});
  const dotRows = rf.figures
    .filter((f) => f.unit === "share")
    .map((f) => ({
      label: f.label,
      rf: f.rf,
      values: datasets
        .map((d) => ({ dataset: d, value: f.policyengine[d]?.["2024"] }))
        .filter((v) => v.value !== undefined && v.value !== null),
    }));
  const rows = rf.figures.map((f) => {
    const row = { key: f.id, figure: f.label, rf: `${formatFigure(f.rf, f.unit)} (p. ${f.page})` };
    for (const d of datasets) {
      for (const y of years) row[`${d}_${y}`] = formatFigure(f.policyengine[d]?.[y], f.unit);
    }
    return row;
  });
  const yearName = (y) => (y === "2024" ? "2024-25" : data.meta.year_labels?.[y] ?? y);
  return (
    <div className="space-y-6">
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="PolicyEngine beside the Resolution Foundation"
          description={
            <>
              The report (
              <a href={data.meta.rf.url} target="_blank" rel="noreferrer" className="underline">
                {data.meta.rf.authors}, {data.meta.rf.date}
              </a>
              ) uses the Family Resources Survey 2024-25 for Great Britain with the IPPR
              tax-benefit model. PolicyEngine&apos;s like-for-like estimates use 2024-25
              incomes; the scheme-year columns show how the figures move with incomes.
            </>
          }
        />
      </div>
      <section className="section-card">
        <SectionHeading
          title="Shares of households, 2024-25"
          description="Shares count the income test alone; passporting is shown in its own rows."
        />
        <DotPlot rows={dotRows} datasets={datasets} />
      </section>
      <section className="section-card space-y-4">
        <SectionHeading
          title="Every figure the report publishes"
          description="The report's column restates each figure with its page. Counts from the Enhanced FRS run high because its weights sum to more households than Microcosm or the report (see the Baseline tab)."
        />
        <Table
          minWidth={960}
          columns={[
            { key: "figure", header: "Figure" },
            { key: "rf", header: "Resolution Foundation", align: "right" },
            ...datasets.flatMap((d) =>
              years.map((y) => ({ key: `${d}_${y}`, header: `${DATASET_SHORT[d]}, ${yearName(y)}`, align: "right" })),
            ),
          ]}
          rows={rows}
        />
        <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
          {rf.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
          {datasets.map((d) => {
            const e = rf.extra?.[d]?.["2024"];
            if (!e) return null;
            return (
              <li key={d}>
                {DATASET_SHORT[d]}, 2024-25: at the report&apos;s amounts the flat option costs{" "}
                {formatBn(e.cost_flat_at_175_bn)} and the tiered option{" "}
                {formatBn(e.cost_tiered_at_220_85_bn)} ({formatBn(e.cost_tiered_own_income_at_220_85_bn)}{" "}
                with passported households tiered on their own income).
              </li>
            );
          })}
        </ul>
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
    </div>
  );
}
