"use client";

// Port of @policyengine/ui-kit PEImpactBarChart (src/charts/impact/PEImpactBarChart.tsx), with
// its ImpactBarLabel and ImpactTooltip: the average-impact-by-decile and poverty-change bars
// used on policyengine.org.

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AXIS_STYLE,
  CHART_MARGINS,
  GRID_STYLE,
  TOOLTIP_CONTAINER_STYLE,
  ZERO_LINE_STYLE,
  getImpactColors,
  getNiceTicks,
  getYAxisLayout,
  theme,
} from "./chartDefaults";

function ImpactBarLabel({ x = 0, y = 0, width = 0, value = 0, formatter }) {
  const labelY = value >= 0 ? y - 4 : y + 16;
  return (
    <text
      x={x + width / 2}
      y={labelY}
      textAnchor="middle"
      fontSize={12}
      fontFamily={theme.fontSans}
      fill={theme.gray700}
    >
      {formatter ? formatter(value) : String(value)}
    </text>
  );
}

// Not in ui-kit: the horizontal layout's value label sits past the end of each bar.
function HorizontalBarLabel({ x = 0, y = 0, width = 0, height = 0, value = 0, formatter }) {
  const left = Math.min(x, x + width);
  const right = Math.max(x, x + width);
  const positive = value >= 0;
  return (
    <text
      x={positive ? right + 4 : left - 4}
      y={y + height / 2}
      dominantBaseline="central"
      textAnchor={positive ? "start" : "end"}
      fontSize={12}
      fontFamily={theme.fontSans}
      fill={theme.gray700}
    >
      {formatter ? formatter(value) : String(value)}
    </text>
  );
}

function categoryWidth(names) {
  if (typeof document === "undefined") return 120;
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return 120;
  ctx.font = "12px Inter, system-ui, sans-serif";
  return Math.ceil(Math.max(...names.map((n) => ctx.measureText(n).width))) + 12;
}

function ImpactTooltip({ active, payload, formatter }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{item.name}</p>
      {item.hoverText && (
        <p style={{ margin: 0, color: theme.mutedForeground }}>{item.hoverText}</p>
      )}
      {!item.hoverText && item.value != null && (
        <p style={{ margin: 0, color: theme.mutedForeground }}>
          {formatter ? formatter(item.value) : String(item.value)}
        </p>
      )}
    </div>
  );
}

export default function PEImpactBarChart({
  data,
  height,
  horizontal = false,
  invertColors = false,
  xAxisLabel,
  yAxisLabel,
  yTickFormatter,
  yTicks,
  showBarLabels = true,
  barLabelFormatter,
  margin = CHART_MARGINS.bar,
}) {
  const colors = getImpactColors(invertColors);
  const values = data.map((d) => d.value);
  const computedTicks = yTicks ?? getNiceTicks([Math.min(0, ...values), Math.max(0, ...values)], 5);
  const yAxis = getYAxisLayout(computedTicks, !!yAxisLabel, yTickFormatter);
  const domain = [computedTicks[0], computedTicks[computedTicks.length - 1]];

  if (horizontal) {
    // Not in ui-kit: the same impact bars laid on their side, one row per category, for
    // groups with long names. The value axis runs along the bottom.
    const labelWidth = Math.min(categoryWidth(data.map((d) => d.name)), 220);
    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height ?? data.length * 40 + 70}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 64, bottom: yAxisLabel ? 30 : 10, left: 4 }}
            barCategoryGap={8}
          >
            <CartesianGrid {...GRID_STYLE} horizontal={false} />
            <XAxis
              type="number"
              ticks={computedTicks}
              domain={domain}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              tickFormatter={yTickFormatter}
              label={
                yAxisLabel
                  ? { value: yAxisLabel, position: "insideBottom", offset: -20, style: AXIS_STYLE }
                  : undefined
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              width={labelWidth}
              tick={AXIS_STYLE}
              tickLine={false}
              axisLine={{ stroke: theme.border }}
              interval={0}
            />
            <Tooltip content={<ImpactTooltip formatter={barLabelFormatter} />} />
            <ReferenceLine x={0} {...ZERO_LINE_STYLE} />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              label={
                showBarLabels
                  ? (props) => <HorizontalBarLabel {...props} formatter={barLabelFormatter} />
                  : undefined
              }
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.value >= 0 ? colors.positive : colors.negative} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height ?? 400}>
        <BarChart data={data} margin={{ ...margin, left: (margin.left ?? 0) + yAxis.marginLeft }}>
          <CartesianGrid {...GRID_STYLE} vertical={false} />
          <XAxis
            dataKey="name"
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            label={
              xAxisLabel
                ? { value: xAxisLabel, position: "insideBottom", offset: -5, style: AXIS_STYLE }
                : undefined
            }
          />
          <YAxis
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            ticks={computedTicks}
            // Not in ui-kit: without a domain, Recharts stops at the data maximum and drops
            // the top nice tick, clipping the label of the tallest bar.
            domain={domain}
            width={yAxis.yAxisWidth}
            tickFormatter={yTickFormatter}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "center",
                    dx: yAxis.labelDx,
                    style: AXIS_STYLE,
                  }
                : undefined
            }
          />
          <Tooltip content={<ImpactTooltip formatter={barLabelFormatter} />} />
          <ReferenceLine y={0} {...ZERO_LINE_STYLE} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
            label={
              showBarLabels
                ? (props) => <ImpactBarLabel {...props} formatter={barLabelFormatter} />
                : undefined
            }
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.value >= 0 ? colors.positive : colors.negative} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
