/**
 * Design tokens — inlined from @policyengine/design-system/tokens/colors
 * to avoid ESM bundling issues with Next.js.
 */
export const colors = {
  primary: {
    50: "#E6FFFA",
    100: "#B2F5EA",
    200: "#81E6D9",
    300: "#4FD1C5",
    400: "#38B2AC",
    500: "#319795",
    600: "#2C7A7B",
    700: "#285E61",
    800: "#234E52",
    900: "#1D4044",
  },
  gray: {
    50: "#F9FAFB",
    100: "#F2F4F7",
    200: "#E2E8F0",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#344054",
    800: "#1F2937",
    900: "#101828",
  },
  border: {
    light: "#E2E8F0",
    medium: "#CBD5E1",
    dark: "#94A3B8",
  },
  error: "#EF4444",
};

// PolicyEngine chart palette (@policyengine/ui-kit --chart-1 … --chart-5).
export const pe = {
  chart1: "#319795",
  chart2: "#0EA5E9",
  chart3: "#285E61",
  chart4: "#026AA2",
  chart5: "#64748B",
  neutral: "#E2E8F0",
  ink: "#101828",
};

// Single-series charts use chart-1, as the standard impact charts do. Two-category splits
// (passported / income test alone / not reached) use the winners-and-losers chart's dark
// teal (chart-3, teal-700) with teal-400, so the page stays in one hue family. The dataviz
// validator separates the pair well (ΔE 25 for normal and colour-blind vision) but flags
// teal-700 as low-chroma, so these series always carry direct labels and a legend.
export const series = {
  a: pe.chart3,
  b: colors.primary[400],
  neutral: pe.neutral,
  ink: pe.ink,
};
