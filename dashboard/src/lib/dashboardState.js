import { PRESET_ORDER, getResult } from "./dataHelpers";

export const TABS = [
  { value: "reform", label: "Economic impact" },
  { value: "household", label: "Your household" },
  { value: "baseline", label: "Baseline and comparisons" },
  { value: "methodology", label: "Methodology" },
];

export function dashboardState(params, data, dataset) {
  const requestedTab =
    params.get("tab") === "report" ? "baseline" : params.get("tab");
  const tab = TABS.some((t) => t.value === requestedTab)
    ? requestedTab
    : "reform";
  const year = data?.meta.years.includes(params.get("year"))
    ? params.get("year")
    : data?.meta.years[0];
  const preset = PRESET_ORDER.includes(params.get("preset"))
    ? params.get("preset")
    : "rf_flat";
  const variant = Object.hasOwn(
    data?.meta.variants ?? {},
    params.get("variant"),
  )
    ? params.get("variant")
    : "published";
  const available = data && getResult(data, year, preset, variant, dataset);
  return {
    tab,
    view: params.get("view") === "eligibility" ? "eligibility" : "overview",
    scenario: {
      year,
      preset: available ? preset : "rf_flat",
      variant: available ? variant : "published",
    },
  };
}

export function dashboardQuery(current, patch) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) params.delete(key);
    else params.set(key, value);
  }
  return params.toString();
}
