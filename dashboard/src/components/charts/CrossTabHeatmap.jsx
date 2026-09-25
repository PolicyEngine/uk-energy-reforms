"use client";

// A 5 × 5 cross-tabulation drawn as a grid of labelled cells. Rows are equivalised income
// quintiles (lowest at the bottom), columns are household income quintiles (lowest on the
// left), so households whose two rankings agree sit on the diagonal. Colour is a
// single-hue sequential ramp; every cell also carries its value, so colour is never the
// only cue. Cells resting on few survey records are hatched and starred.

import { THIN_ESS } from "../../lib/dataHelpers";
import { HEAT_RAMP, boundLabel, heatBin } from "../../lib/distributions";
import { formatMillions, formatShare } from "../../lib/formatters";
import { textOn } from "../ui";

const HATCH = "repeating-linear-gradient(45deg, rgba(255,255,255,0.55) 0 3px, transparent 3px 7px)";

export default function CrossTabHeatmap({
  cells,
  rowCuts,
  colCuts,
  metric,
  rowTitle,
  colTitle,
  n = 5,
}) {
  const values = cells.map((c) => c[metric]).filter((v) => v != null);
  const max = metric === "eligible" ? 1 : Math.max(...values, 0);
  const cell = (r, c) => cells.find((x) => x.row === r && x.col === c);
  const rows = Array.from({ length: n }, (_, i) => n - i);
  const cols = Array.from({ length: n }, (_, i) => i + 1);

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <div className="min-w-[560px]">
          <div className="grid grid-cols-[28px_128px_repeat(5,minmax(0,1fr))] gap-1">
            <div
              className="row-span-5 flex items-center justify-center text-xs text-slate-500"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {rowTitle}
            </div>
            {rows.map((r) => (
              <div key={r} className="contents">
                <div className="flex flex-col justify-center pr-2 text-right text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {r === 1 ? "1 (lowest)" : r === n ? `${n} (highest)` : r}
                  </span>
                  <span>{boundLabel(rowCuts, r, n)}</span>
                </div>
                {cols.map((c) => {
                  const x = cell(r, c);
                  const value = x?.[metric];
                  const bin = heatBin(value, max);
                  const fill = bin == null ? "#FFFFFF" : HEAT_RAMP[bin];
                  const thin = x && x.households_m > 0 && x.ess < THIN_ESS;
                  const label = value == null ? "–" : `${formatShare(value)}${thin ? "*" : ""}`;
                  return (
                    <div
                      key={c}
                      role="img"
                      aria-label={`Equivalised quintile ${r}, household quintile ${c}: ${label}, ${formatMillions(x?.households_m ?? 0, 2)} households`}
                      title={`${formatMillions(x?.households_m ?? 0, 2)} households; effective sample ${Math.round(x?.ess ?? 0)}`}
                      className="flex h-14 flex-col items-center justify-center rounded-md border border-white text-center"
                      style={{
                        background: thin ? `${HATCH}, ${fill}` : fill,
                        color: bin == null ? "#64748B" : textOn(fill),
                      }}
                    >
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-[11px] opacity-80">
                        {formatMillions(x?.households_m ?? 0, 2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            <div />
            <div />
            {cols.map((c) => (
              <div key={c} className="pt-1 text-center text-xs text-slate-600">
                <span className="block font-semibold text-slate-800">
                  {c === 1 ? "1 (lowest)" : c === n ? `${n} (highest)` : c}
                </span>
                <span>{boundLabel(colCuts, c, n)}</span>
              </div>
            ))}
          </div>
          <p className="mt-1 pl-[160px] text-center text-xs text-slate-500">{colTitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span>Lower</span>
        {HEAT_RAMP.map((colour) => (
          <span
            key={colour}
            aria-hidden
            className="inline-block h-3 w-6 rounded-sm border border-slate-200"
            style={{ background: colour }}
          />
        ))}
        <span>Higher</span>
        <span className="ml-3">* rests on few survey records (effective sample below 30)</span>
      </div>
    </div>
  );
}
