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

// Two-category series (passported / income test only). Teal-only pairs fail the
// colour-vision checks, so the second series uses PolicyEngine's chart dark blue.
// Validated pair (dataviz validator, light surface): all checks pass; teal-400 sits
// below 3:1 contrast, so these series always carry direct labels or a table.
export const series = {
  a: "#38B2AC",
  b: "#026AA2",
  neutral: "#E2E8F0",
  ink: "#101828",
};

// Ordered bands (winners and losers): one hue, dark to light, then neutral.
export const bands = {
  gain_more_than_5pct: "#285E61",
  gain_less_than_5pct: "#4FD1C5",
  no_change: "#E2E8F0",
  lose_less_than_5pct: "#FCA5A5",
  lose_more_than_5pct: "#B91C1C",
};
