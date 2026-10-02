"use client";

import { series } from "../lib/colors";

const METRIC_ICONS = {
  cost: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 8.5a2.5 2.5 0 0 0-4.5 1.5v6h5M8.5 12.5h4M8.5 16h1.5" />
    </>
  ),
  households: (
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9v11h14V9" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  average: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
      <path d="M9 8h6M9 12h6M9 16h3" />
    </>
  ),
  energy: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
  benefit: (
    <>
      <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  income: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18M16 14.5h2" />
    </>
  ),
  poverty: (
    <>
      <path d="m3 7 6 6 4-4 8 8" />
      <path d="M15 17h6v-6" />
    </>
  ),
};

export function MetricCard({ label, value, note, icon }) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="metric-icon" aria-hidden>
            <svg viewBox="0 0 24 24">{METRIC_ICONS[icon]}</svg>
          </span>
        )}
        <p className="text-sm font-semibold leading-snug text-slate-700">
          {label}
        </p>
      </div>
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
    <label className="option-select">
      {label && <span className="eyebrow text-slate-500">{label}</span>}
      <span className="option-select-box">
        <select
          value={value}
          aria-label={label ? undefined : "View"}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 20 20" className="option-select-chevron">
          <path
            d="M5 7.5l5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </label>
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
  const luminance =
    0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
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
    <div className="legend-box">
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
    <details className="disclosure">
      <summary>{label}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

export function Disclosure({
  title = "How to read this chart",
  children,
  className = "",
}) {
  return (
    <details className={`disclosure ${className}`}>
      <summary>{title}</summary>
      <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
        {children}
      </div>
    </details>
  );
}
