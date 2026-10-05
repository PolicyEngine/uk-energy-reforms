import { PRESET_ORDER, getResult } from "./dataHelpers";

export const TABS = [
  { value: "reform", label: "Economic impact" },
  { value: "household", label: "Your household" },
  { value: "baseline", label: "Baseline" },
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
    scenario: {
      year,
      preset: available ? preset : "rf_flat",
      variant: available ? variant : "published",
    },
  };
}

// The Economic impact tab once had a separate eligibility view (?view=eligibility). It
// is now a section of the tab, so old links land on that section and lose the parameter.
export function legacyAnchor(params) {
  return params.get("view") === "eligibility" ? "overview-targeting" : null;
}

export function dashboardQuery(current, patch) {
  const params = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value == null) params.delete(key);
    else params.set(key, value);
  }
  return params.toString();
}
