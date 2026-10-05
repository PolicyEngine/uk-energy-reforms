// Accessors over the pre-computed results written by `uk-energy-reforms export-dashboard`.

export const PRESET_ORDER = [
  "rf_flat",
  "rf_tiered",
  "rf_tiered_own_income",
  "rf_household_income",
  "passport_only",
];

export const PRESET_NOTES = {
  rf_flat: "£175 to every eligible household (RF's flat option).",
  rf_tiered:
    "£220 below £18,000 and £85 from £18,000 to £24,000; passported households get £220.",
  rf_tiered_own_income:
    "As tiered, but passported households are tiered on their own income, with £85 as the floor.",
  rf_household_income:
    "RF's comparator: equivalised household taxable income below £30,000 instead of the highest individual income.",
  passport_only:
    "Benefit passporting alone, as the Warm Home Discount does, at £175.",
};

export const DATASET_ORDER = ["microcosm_national"];

// The page shows Microcosm, the only dataset exported. The Enhanced FRS stays in the
// analysis results and receipts; a ?dataset= link to it falls back to Microcosm.
export const DEFAULT_DATASET = "microcosm_national";

export function datasetFromQuery(value, data) {
  return value && data?.meta?.datasets?.[value] ? value : DEFAULT_DATASET;
}

export const DATASET_SHORT = {
  microcosm_national: "Microcosm",
};

// Payment variants as they read inside a sentence ("Spending and gains use …").
export const VARIANT_PROSE = {
  published: "RF's amounts",
  budget_2bn: "amounts scaled to a £2bn budget",
  bill_share: "a bill-share payment",
};

// The price level each dataset stores energy spend at. policyengine-uk does not uprate
// energy spend between years, so bills in every scheme year stay at this level.
export const PRICE_BASIS = {
  microcosm_national: "2024-25 DESNZ prices",
};

const REPO = "https://github.com/PolicyEngine/uk-energy-reforms";

/** The scheme year's results receipt, at its counts around every option's income
 * cut-offs (the `## Income cut-offs` section `uk-energy-reforms run` writes). */
export function cutOffReceiptUrl(year) {
  return `${REPO}/blob/main/analyses/rf-billing-me-softly/results-${year}/report.md#income-cut-offs`;
}

export function scenarioId(preset, variant) {
  if (variant === "published") return preset;
  if (variant === "bill_share") return `${preset}_bill_share`;
  return `${preset}_budget_2bn`;
}

export function getResult(data, year, preset, variant, dataset) {
  return data.results?.[year]?.[scenarioId(preset, variant)]?.[dataset];
}

/** Eligibility, spending and gains for the selected scenario's payment basis. */
export function getDistributions(data, year, preset, variant, dataset) {
  return data.distributions?.[year]?.[scenarioId(preset, variant)]?.[dataset];
}

export function getBaseline(data, year, dataset) {
  return data.baseline?.[year]?.[dataset];
}

export function getRfFigure(data, id) {
  return data.rf_comparison.figures.find((f) => f.id === id);
}

export function getSource(data, id) {
  return (data.external_sources ?? []).find((s) => s.id === id);
}

export function yearLabel(data, year) {
  return data.meta.year_labels?.[year] ?? year;
}

/** Plain-English description of a resolved schedule. */
export function describeSchedule(schedule) {
  const [, t1, t2] = schedule.thresholds;
  const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
  const test = schedule.household_equivalised
    ? "equivalised household taxable income"
    : "highest individual taxable income";
  const value = (i) =>
    schedule.bill_share
      ? `${(100 * schedule.rates[i]).toFixed(1)}%`
      : gbp(schedule.amounts[i]);
  const basis = schedule.bill_share
    ? " of the annual gas and electricity bill"
    : "";
  if (!schedule.income_test) {
    return `${value(0)}${basis} for households receiving a qualifying means-tested benefit. There is no income test.`;
  }
  const flat = schedule.bill_share
    ? schedule.rates[0] === schedule.rates[1]
    : schedule.amounts[0] === schedule.amounts[1];
  if (flat)
    return `${value(0)}${basis} if ${test} is below ${gbp(t2)}, or anyone receives a qualifying means-tested benefit.`;
  const passport =
    schedule.passport_assessed_income === 0
      ? `Households qualifying through benefits receive ${value(0)}.`
      : `Households qualifying through benefits are tiered on their income, with ${value(1)} as the minimum.`;
  return `${schedule.bill_share ? "Share of the annual energy bill: " : ""}${value(0)} below ${gbp(t1)}; ${value(1)} from ${gbp(t1)} to below ${gbp(t2)} (${test}). ${passport}`;
}
