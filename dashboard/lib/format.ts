const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

export const gbp = (v: number) => gbp0.format(v);

export const gbpBn = (v: number) =>
  `${v < 0 ? "-" : ""}£${Math.abs(v).toFixed(2)}bn`;

export const pct = (v: number, digits = 0) => `${(100 * v).toFixed(digits)}%`;

export const millions = (v: number, digits = 2) => `${v.toFixed(digits)}m`;

export const thousands = (v: number) =>
  `${Math.round(v).toLocaleString("en-GB")}k`;

export const signedThousands = (v: number) => {
  const r = Math.round(v);
  if (r === 0) return "0";
  return `${r > 0 ? "+" : "-"}${Math.abs(r).toLocaleString("en-GB")}k`;
};

export const signedPp = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "-" : ""}${Math.abs(v).toFixed(2)}pp`;

export const POVERTY_MEASURES: Record<string, string> = {
  rel_pov_ahc: "Relative poverty, after housing costs",
  rel_pov_bhc: "Relative poverty, before housing costs",
  abs_pov_ahc: "Absolute poverty, after housing costs",
  abs_pov_bhc: "Absolute poverty, before housing costs",
};

export const POVERTY_GROUPS: Record<string, string> = {
  people: "All people",
  children: "Children",
  working_age_adults: "Working-age adults",
  pensioners: "Pensioners",
};

export function formatRf(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return "n/a";
  if (unit === "share") return pct(value);
  if (unit === "gbp") return gbp(value);
  if (unit === "millions") return `${value.toFixed(1)}m`;
  if (unit === "thousands") return thousands(value);
  return String(value);
}
