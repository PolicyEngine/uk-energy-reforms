// Helpers for the "eligibility across income measures" section. The data come from
// analysis.income_distributions: household-weighted deciles (a tenth of GB households
// each) of five baseline income measures, and 5 × 5 quintile cross-tabulations.

import { colors } from "./colors";

export const MEASURE_OPTIONS = [
  { value: "eq", label: "Equivalised household income" },
  { value: "net", label: "Household net income" },
  { value: "taxable", label: "Household taxable income" },
];

export const BASIS_OPTIONS = [
  { value: "bhc", label: "Before housing costs" },
  { value: "ahc", label: "After housing costs" },
];

export const MEASURE_NAMES = {
  eq: "equivalised household net income",
  net: "household net income",
  taxable: "household taxable income",
};

/** Key of a distribution in the exported data: eq_bhc, net_ahc, taxable, … */
export function distributionKey(measure, basis) {
  return measure === "taxable" ? "taxable" : `${measure}_${basis}`;
}

/** Key of a cross-tabulation: equivalised rows against household columns. */
export function crosstabKey(basis, columnMeasure) {
  return `eq_${basis}|${distributionKey(columnMeasure, basis)}`;
}

// Single-hue sequential ramp (light to dark) for the heatmap.
export const HEAT_RAMP = [
  colors.primary[50],
  colors.primary[100],
  colors.primary[300],
  colors.primary[500],
  colors.primary[700],
];

/** Index into HEAT_RAMP for a value on [0, max]; null values have no bin. */
export function heatBin(value, max, steps = HEAT_RAMP.length) {
  if (value == null || !max) return null;
  const t = Math.min(Math.max(value / max, 0), 1);
  return Math.min(Math.floor(t * steps), steps - 1);
}

const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;

/**
 * Income range of group i (1-based) of n, from the n - 1 cut points. The first group
 * has no lower bound (it holds any negative incomes) and the last no upper bound.
 */
export function boundLabel(cuts, i, n = cuts.length + 1) {
  if (!cuts?.length) return "";
  if (i === 1) return `below ${gbp(cuts[0])}`;
  if (i === n) return `${gbp(cuts[n - 2])} and above`;
  return `${gbp(cuts[i - 2])} to ${gbp(cuts[i - 1])}`;
}

export function groupLabel(i, n) {
  if (i === 1) return "1 (lowest)";
  if (i === n) return `${n} (highest)`;
  return String(i);
}

export const INCOME_COUNT_LABELS = {
  0: "No member with taxable income",
  1: "One member",
  2: "Two members",
  "3+": "Three or more",
};
