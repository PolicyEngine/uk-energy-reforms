"use client";

// Port of @policyengine/ui-kit PEWinnersLosersChart (src/charts/impact/PEWinnersLosersChart.tsx):
// the intra-decile winners and losers chart used on policyengine.org.

import { Bar, BarChart, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AXIS_STYLE, TOOLTIP_CONTAINER_STYLE, theme, winnersLosersColors } from "./chartDefaults";

const SEGMENT_KEYS = ["gainMore5", "gainLess5", "noChange", "loseLess5", "loseMore5"];

const LEGEND_ITEMS = [
  { key: "gainMore5", label: "Gain more than 5%" },
  { key: "gainLess5", label: "Gain less than 5%" },
  { key: "noChange", label: "No change" },
  { key: "loseLess5", label: "Loss less than 5%" },
  { key: "loseMore5", label: "Loss more than 5%" },
];

const LEGEND_MAP = Object.fromEntries(LEGEND_ITEMS.map((item) => [item.key, item.label]));

const BAR_SIZE = 22;

function WinnersLosersTooltipContent({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  const label = item.name === "All" ? "All households" : `Decile ${item.name}`;
  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{label}</p>
      {SEGMENT_KEYS.map((key, i) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, padding: "1px 0" }}>
          <span
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: winnersLosersColors[i],
              flexShrink: 0,
            }}
          />
          <span style={{ color: theme.mutedForeground, fontSize: 13 }}>
            {LEGEND_MAP[key]}: {(item[key] * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function segmentBars() {
  return SEGMENT_KEYS.map((key, i) => (
    <Bar key={key} dataKey={key} stackId="a" fill={winnersLosersColors[i]} isAnimationActive={false} />
  ));
}

export default function PEWinnersLosersChart({
  data,
  allData,
  xLabel = "Population share",
  yLabel = "Income decile",
}) {
  const allChartData = allData ? [{ name: "All", ...allData }] : null;
  const decileHeight = data.length * (BAR_SIZE + 1) + 60;

  return (
    // Not in ui-kit: below the sm breakpoint the legend moves under the bars, which a
    // side legend would squeeze to a sliver at phone width.
    <div className="flex w-full flex-col sm:flex-row">
      <div className="flex min-w-0 flex-1 flex-col">
        {allChartData && (
          <>
            <div style={{ height: 50 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={allChartData}
                  stackOffset="expand"
                  barSize={BAR_SIZE}
                  margin={{ top: 8, right: 10, bottom: 0, left: 56 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={AXIS_STYLE}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip
                    content={<WinnersLosersTooltipContent />}
                    allowEscapeViewBox={{ x: true, y: true }}
                    offset={20}
                    wrapperStyle={{ zIndex: 1000 }}
                  />
                  {segmentBars()}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ height: 12 }} />
          </>
        )}

        <div style={{ height: decileHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              stackOffset="expand"
              barSize={BAR_SIZE}
              barCategoryGap={1}
              margin={{ top: 0, right: 10, bottom: 40, left: 56 }}
            >
              <XAxis
                type="number"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={{ stroke: theme.border }}
                tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
              >
                {xLabel && <Label value={xLabel} position="bottom" offset={20} style={AXIS_STYLE} />}
              </XAxis>
              <YAxis
                type="category"
                dataKey="name"
                tick={AXIS_STYLE}
                tickLine={false}
                axisLine={{ stroke: theme.border }}
                width={40}
                interval={0}
              >
                {yLabel && (
                  <Label
                    value={yLabel}
                    angle={-90}
                    position="insideLeft"
                    dx={-16}
                    style={{ textAnchor: "middle", ...AXIS_STYLE }}
                  />
                )}
              </YAxis>
              <Tooltip
                content={<WinnersLosersTooltipContent />}
                allowEscapeViewBox={{ x: true, y: true }}
                offset={20}
                wrapperStyle={{ zIndex: 1000 }}
              />
              {segmentBars()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex shrink-0 flex-row flex-wrap gap-x-4 gap-y-2 pl-14 sm:flex-col sm:flex-nowrap sm:justify-center sm:gap-2 sm:pl-4 sm:pr-2">
        {LEGEND_ITEMS.map((item, i) => (
          <div key={item.key} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: winnersLosersColors[i] }}
            />
            <span className="whitespace-nowrap text-xs" style={{ color: theme.mutedForeground }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
