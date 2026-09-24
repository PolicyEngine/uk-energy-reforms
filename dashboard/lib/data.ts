import raw from "@/data/results.json";

export type DatasetKey = string;

export interface Headline {
  cost_bn: number;
  recipients_m: number;
  recipient_share: number;
  average_per_recipient: number;
  eligible_share: number;
  passported_share: number;
  income_test_share: number;
  income_only_share: number;
  cost_passported_bn: number;
  cost_income_only_bn: number;
  gb_households_m: number;
}

export interface DecileRow {
  decile: number;
  households_m: number;
  share_receiving: number;
  average_gain: number;
  gain_pct_net_income: number;
}

export interface PovertyRow {
  measure: string;
  group: string;
  baseline_rate: number;
  reform_rate: number;
  change_pp: number;
  change_k: number;
}

export interface CoverageRow {
  group: string;
  households_m: number;
  covered_by_passport: number;
  covered: number;
  missed_m: number;
}

export interface Band {
  households_k: number;
  sample_n: number;
  ess: number;
  bottom4_k: number;
  abs_ahc_poor_k: number;
  rel_ahc_poor_k: number;
  mean_eq_ahc: number | null;
  mean_bill: number | null;
}

export interface Cliff {
  threshold: number;
  mean_drop: number;
  dead_zone_k: number;
  dead_zone_struggling_k: number;
  dead_zone_median_width: number;
  bands: Record<"1000_below" | "500_above" | "1000_above" | "2000_above", Band>;
}

export interface BreakdownRow {
  group: string;
  households_m: number;
  ess: number;
  eligible_rate: number;
  passported_rate: number;
  income_test_rate: number;
  recipients_m: number;
  cost_m: number;
  cost_share: number;
  average_per_recipient: number;
  gain_pct_net_income: number;
  mean_bill: number;
  abs_ahc_poverty_rate: number;
  abs_ahc_poor_covered: number;
  abs_ahc_poor_missed_k: number;
  rel_ahc_poor_missed_k: number;
  bottom4_missed_k: number;
  people_out_of_rel_ahc_poverty_k: number;
  people_out_of_abs_ahc_poverty_k: number;
  just_above_top_threshold_k: number;
  just_above_bottom4_k: number;
  dead_zone_k: number;
}

export interface Schedule {
  unit_rate: boolean;
  thresholds: number[];
  amounts: number[];
  rates: number[];
  passport_assessed_income: number;
  income_test: boolean;
  household_equivalised?: boolean;
}

export interface Result {
  headline: Headline;
  by_bracket: Record<string, { recipients_m: number; cost_bn: number; average: number }>;
  schedule: Schedule;
  deciles: DecileRow[];
  poverty: PovertyRow[];
  coverage: CoverageRow[];
  cliffs: Cliff[];
  by_region: BreakdownRow[];
  by_household_type: BreakdownRow[];
}

export interface Scenario {
  id: string;
  preset: string;
  variant: "published" | "budget_2bn" | "unit_rate";
  label: string;
  description: string;
}

export interface RfFigure {
  id: string;
  label: string;
  rf: number;
  rf_statement: string;
  page: number;
  unit: "share" | "gbp" | "millions" | "thousands";
  policyengine: Record<DatasetKey, Record<string, number>>;
}

export interface DashboardData {
  meta: {
    generated: string;
    year: string;
    policyengine_uk: string;
    datasets: Record<
      DatasetKey,
      { label: string; notes: string; repo: string; revision: string; sha256: string }
    >;
    presets: Record<string, string>;
    variants: Record<string, string>;
    rf: { title: string; authors: string; publisher: string; date: string; url: string };
  };
  scenarios: Scenario[];
  results: Record<string, Record<DatasetKey, Result>>;
  replication_2024: Record<string, Record<DatasetKey, Result>>;
  rf_comparison: {
    figures: RfFigure[];
    extra: Record<DatasetKey, Record<string, Record<string, number>>>;
    not_modelled: { rf_statement: string; page: number; reason: string }[];
    notes: string[];
  };
}

export const data = raw as unknown as DashboardData;

export const DATASET_ORDER = ["microcosm_979", "efrs_1573"].filter(
  (d) => d in data.meta.datasets,
);

export const DATASET_SHORT: Record<string, string> = {
  microcosm_979: "Microcosm",
  efrs_1573: "Enhanced FRS",
};

export function scenarioId(preset: string, variant: string): string {
  if (variant === "published") return preset;
  if (variant === "unit_rate") return `${preset}_unit_rate`;
  return `${preset}_budget_2bn`;
}
