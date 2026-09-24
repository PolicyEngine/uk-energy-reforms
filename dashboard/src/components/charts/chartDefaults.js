// Ported from @policyengine/ui-kit (src/charts/chartDefaults.ts, src/charts/colorSemantics.ts
// and src/utils/chartUtils.ts) so the standard impact charts match policyengine.org. The
// published dashboards do not load ui-kit's theme, so its CSS variables are resolved here to
// ui-kit's light-theme values (src/theme/tokens.css).

const FONT_SANS = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

export const theme = {
  border: "#E2E8F0",
  mutedForeground: "#475569",
  background: "#FFFFFF",
  chart1: "#319795",
  gray200: "#E2E8F0",
  gray400: "#94A3B8",
  gray600: "#475569",
  gray700: "#344054",
  teal700: "#285E61",
  primaryAlpha60: "rgba(44, 122, 123, 0.6)",
  fontSans: FONT_SANS,
};

export const AXIS_STYLE = {
  fontFamily: FONT_SANS,
  fontSize: 12,
  fill: theme.mutedForeground,
};

export const GRID_STYLE = {
  stroke: theme.border,
  strokeDasharray: "3 3",
};

export const ZERO_LINE_STYLE = {
  stroke: theme.gray600,
  strokeWidth: 1,
};

export const TOOLTIP_CONTAINER_STYLE = {
  fontFamily: FONT_SANS,
  fontSize: 13,
  backgroundColor: theme.background,
  border: `1px solid ${theme.border}`,
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(16, 24, 40, 0.1)",
  padding: "8px 12px",
  maxWidth: "min(300px, 90vw)",
};

/** Positive and negative impact bars; inverted where a decrease is good (poverty). */
export function getImpactColors(invertColors) {
  return invertColors
    ? { positive: theme.gray600, negative: theme.chart1 }
    : { positive: theme.chart1, negative: theme.gray600 };
}

/** Five-segment winners and losers scale, most positive to most negative. */
export const winnersLosersColors = [
  theme.teal700,
  theme.primaryAlpha60,
  theme.gray200,
  theme.gray400,
  theme.gray600,
];

export const CHART_MARGINS = {
  bar: { top: 20, right: 20, bottom: 20, left: 0 },
};

const NICE_STEPS = [1, 2, 2.5, 5, 10];

/** D3-style "nice" axis ticks. */
export function getNiceTicks(domain, count = 5) {
  const [rawMin, rawMax] = domain;
  if (rawMin === rawMax) return [rawMin];
  if (count <= 1) return [rawMin];
  const roughStep = (rawMax - rawMin) / (count - 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceStep = magnitude;
  for (const s of NICE_STEPS) {
    if (normalized <= s) {
      niceStep = s * magnitude;
      break;
    }
  }
  const niceMin = Math.floor(rawMin / niceStep) * niceStep;
  const niceMax = Math.ceil(rawMax / niceStep) * niceStep;
  const ticks = [];
  for (let v = niceMin; v <= niceMax + niceStep * 0.01; v += niceStep) {
    ticks.push(parseFloat(v.toPrecision(12)));
  }
  return ticks;
}

/** Y-axis width, left margin and label offset measured from the tick labels. */
export function getYAxisLayout(ticks, hasLabel, formatter) {
  let maxTickWidth = 30;
  if (typeof document !== "undefined" && ticks.length > 0) {
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.font = "12px Inter, system-ui, sans-serif";
      const labels = ticks.map((t) => (formatter ? formatter(t) : String(t)));
      maxTickWidth = Math.max(...labels.map((l) => ctx.measureText(l).width));
    }
  }
  const yAxisWidth = Math.ceil(maxTickWidth) + 4 + 4;
  const marginLeft = hasLabel ? 12 + 20 + 4 : 4;
  const labelDx = -(Math.ceil(maxTickWidth) / 2 + 4 + 16);
  return { yAxisWidth, marginLeft, labelDx };
}
