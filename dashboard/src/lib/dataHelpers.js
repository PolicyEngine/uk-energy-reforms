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
  rf_tiered: "£220 below £18,000 and £85 from £18,000 to £24,000; passported households get £220.",
  rf_tiered_own_income:
    "As tiered, but passported households are tiered on their own income, with £85 as the floor.",
  rf_household_income:
    "RF's comparator: equivalised household income below £30,000 instead of the highest individual income.",
  passport_only: "Benefit passporting alone, as the Warm Home Discount does, at £175.",
};

export const DATASET_ORDER = ["microcosm_979", "efrs_1573"];

// The page shows Microcosm. The exported data also carries the Enhanced FRS for internal
// use: open the page with ?dataset=efrs_1573 to switch every tab to it.
export const DEFAULT_DATASET = "microcosm_979";

export function datasetFromQuery(value, data) {
  return value && data?.meta?.datasets?.[value] ? value : DEFAULT_DATASET;
}

export const DATASET_SHORT = {
  microcosm_979: "Microcosm",
  efrs_1573: "Enhanced FRS",
};

export function scenarioId(preset, variant) {
  if (variant === "published") return preset;
  if (variant === "bill_share") return `${preset}_bill_share`;
  return `${preset}_budget_2bn`;
}

export function getResult(data, year, preset, variant, dataset) {
  return data.results?.[year]?.[scenarioId(preset, variant)]?.[dataset];
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
    ? "equivalised household income"
    : "highest individual taxable income";
  const value = (i) =>
    schedule.bill_share
      ? `${(100 * schedule.rates[i]).toFixed(1)}% off the annual gas and electricity bill`
      : gbp(schedule.amounts[i]);
  if (!schedule.income_test) {
    return `${value(0)} to passported households only; there is no income test.`;
  }
  const flat = schedule.bill_share
    ? schedule.rates[0] === schedule.rates[1]
    : schedule.amounts[0] === schedule.amounts[1];
  const parts = flat
    ? [`${value(0)} where ${test} is below ${gbp(t2)}`]
    : [`${value(0)} below ${gbp(t1)}`, `${value(1)} from ${gbp(t1)} to ${gbp(t2)} (${test})`];
  const passport =
    schedule.passport_assessed_income === 0
      ? "passported households get the first tier"
      : "passported households are tiered on their own income, with the second tier as the floor";
  return `${parts.join("; ")}; ${passport}.`;
}
