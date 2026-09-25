"use client";

import { series } from "../lib/colors";

export function MetricCard({ label, value, note }) {
  return (
    <div className="metric-card">
      <p className="text-sm font-semibold leading-snug text-slate-700">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {note && (
        <p className="mt-2 border-t border-slate-100 pt-2 text-xs leading-5 text-slate-500">
          {note}
        </p>
      )}
    </div>
  );
}

export function SourceLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline">
      {children}
    </a>
  );
}

export function Toggle({ label, options, value, onChange }) {
  return (
    <div>
      {label && <p className="eyebrow mb-2 text-slate-500">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`toggle-button ${value === option.value ? "active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Note({ eyebrow, children }) {
  return (
    <div className="note-card rounded-r-xl p-4">
      {eyebrow && <p className="eyebrow note-eyebrow mb-1">{eyebrow}</p>}
      <div className="note-body text-sm leading-6">{children}</div>
    </div>
  );
}

export function Warning({ children }) {
  return (
    <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 text-sm leading-6 text-slate-800">
      {children}
    </div>
  );
}

// Dark ink on light fills, white on dark ones (relative luminance above 0.3 counts as light).
function textOn(hex) {
  const channel = (i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.3 ? series.ink : "#FFFFFF";
}

/**
 * Horizontal bar split into labelled segments that add up to 100% of a group.
 * Every segment carries its own value label, so identity never rests on colour.
 */
export function SplitBar({ segments }) {
  return (
    <div className="flex h-8 w-full overflow-hidden rounded-md bg-slate-100">
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.key}
            title={`${s.label}: ${(100 * s.value).toFixed(0)}%`}
            className="flex items-center justify-center border-r-2 border-white text-xs font-semibold last:border-r-0"
            style={{
              width: `${100 * s.value}%`,
              background: s.color,
              color: textOn(s.color),
            }}
          >
            {s.value >= 0.06 ? `${(100 * s.value).toFixed(0)}%` : ""}
          </div>
        ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="inline-block h-3 w-3 rounded-sm"
            style={{ background: item.color }}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function Table({ columns, rows, minWidth }) {
  return (
    <div className="overflow-x-auto">
      <table className="data-table" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} style={{ textAlign: c.align ?? "left" }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.key ?? i}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align ?? "left" }}>
                  {c.format ? c.format(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A table under a chart, collapsed until the reader asks for the numbers. */
export function TableToggle({ label = "Show the numbers", children }) {
  return (
    <details className="table-toggle group">
      <summary className="toggle-button inline-flex cursor-pointer list-none items-center gap-2">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
        <span className="group-open:hidden">{label}</span>
        <span className="hidden group-open:inline">Hide the numbers</span>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
