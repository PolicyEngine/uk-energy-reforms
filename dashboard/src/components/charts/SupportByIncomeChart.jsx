"use client";

// The discount a household would receive as one adult's taxable income changes: a step
// line (support changes only where the tested income reaches a line), with the adult's
// current income marked.

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "../../lib/formatters";
import {
  AXIS_STYLE,
  GRID_STYLE,
  TOOLTIP_CONTAINER_STYLE,
  getNiceTicks,
  theme,
} from "./chartDefaults";

const thousands = (v) => (v === 0 ? "£0" : `£${Math.round(v / 1000)}k`);

function SupportTooltip({ active, payload, who }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div style={TOOLTIP_CONTAINER_STYLE}>
      <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>
        {who}: {formatCurrency(point.income)} a year
      </p>
      <p style={{ margin: 0, color: theme.mutedForeground }}>
        Discount: {formatCurrency(point.amount)}
      </p>
    </div>
  );
}

export default function SupportByIncomeChart({ curve, current, maxIncome, who }) {
  const xTicks = getNiceTicks([0, maxIncome], 7);
  const top = Math.max(...curve.map((p) => p.amount), 0);
  const yTicks = getNiceTicks([0, top > 0 ? top : 100], 5);
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer>
        <LineChart data={curve} margin={{ top: 24, right: 24, bottom: 30, left: 8 }}>
          <CartesianGrid {...GRID_STYLE} vertical={false} />
          <XAxis
            dataKey="income"
            type="number"
            domain={[0, xTicks[xTicks.length - 1]]}
            ticks={xTicks}
            tickFormatter={thousands}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            label={{
              value: `${who}'s taxable income (a year)`,
              position: "insideBottom",
              offset: -18,
              style: AXIS_STYLE,
            }}
          />
          <YAxis
            domain={[0, yTicks[yTicks.length - 1]]}
            ticks={yTicks}
            tickFormatter={formatCurrency}
            tick={AXIS_STYLE}
            tickLine={false}
            axisLine={{ stroke: theme.border }}
            width={56}
          />
          <Tooltip content={<SupportTooltip who={who} />} />
          <ReferenceLine
            x={Math.min(current, xTicks[xTicks.length - 1])}
            stroke={theme.gray600}
            strokeDasharray="4 4"
            label={{
              value: `Now: ${formatCurrency(current)}`,
              position: "top",
              fontSize: 12,
              fill: theme.gray700,
            }}
          />
          <Line
            type="stepAfter"
            dataKey="amount"
            stroke={theme.chart1}
            strokeWidth={2.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
