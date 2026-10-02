// Helpers for the "eligibility across income measures" section. The data come from
// analysis.income_distributions: household-weighted deciles (a tenth of GB households
// each) of five baseline income measures.

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
