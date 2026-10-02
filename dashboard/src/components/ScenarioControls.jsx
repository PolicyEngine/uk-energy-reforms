"use client";

import {
  PRESET_NOTES,
  PRESET_ORDER,
  describeSchedule,
  getResult,
  yearLabel,
} from "../lib/dataHelpers";
import { formatCurrency, formatMillions, formatShare } from "../lib/formatters";
import { Disclosure, Warning } from "./ui";

export default function ScenarioControls({
  data,
  dataset,
  scenario,
  onChange,
  onMethodology,
}) {
  const { preset, variant, year } = scenario;
  const result = getResult(data, year, preset, variant, dataset);
  const published = getResult(data, year, preset, "published", dataset);
  return (
    <section aria-label="Selected reform" className="scenario-bar">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.7fr)]">
        <label className="control-label col-span-2 sm:col-span-1">
          Reform option
          <select
            value={preset}
            onChange={(e) => onChange({ preset: e.target.value })}
          >
            {PRESET_ORDER.filter((p) => data.results[year]?.[p]).map((p) => (
              <option key={p} value={p}>
                {data.meta.presets[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="control-label">
          Payment basis
          <select
            value={variant}
            onChange={(e) => onChange({ variant: e.target.value })}
          >
            {Object.entries(data.meta.variants).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="control-label">
          Year
          <select
            value={year}
            onChange={(e) => onChange({ year: e.target.value })}
          >
            {data.meta.years.map((y) => (
              <option key={y} value={y}>
                {yearLabel(data, y)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p aria-live="polite" className="mt-3 text-sm leading-6 text-slate-700">
        {result && describeSchedule(result.schedule)}
      </p>
      <Disclosure title="How the options differ" className="mt-2">
        <div className="grid gap-6 md:grid-cols-2">
          <dl className="space-y-3">
            {PRESET_ORDER.map((p) => (
              <div key={p}>
                <dt className="font-semibold">{data.meta.presets[p]}</dt>
                <dd>{PRESET_NOTES[p]}</dd>
              </div>
            ))}
          </dl>
          <div className="space-y-3">
            <p>
              <strong>RF&apos;s amounts:</strong> fixed payments based on the
              Resolution Foundation&apos;s published averages. Total cost
              depends on how many households qualify.
            </p>
            <p>
              <strong>Scaled to £2bn:</strong> the same payment pattern,
              adjusted to a total cost of £2bn in the selected year.
            </p>
            <p>
              <strong>Bill share:</strong> a percentage of each household&apos;s
              gas and electricity bill, calibrated to the published average
              payments.
            </p>
            <p>
              {yearLabel(data, data.meta.years[0])} includes January to March
              2027, the proposed winter window. Amounts are the total discount,
              not a monthly payment.
            </p>
            <button type="button" onClick={onMethodology} className="text-link">
              Read the modelling assumptions →
            </button>
          </div>
        </div>
      </Disclosure>
      {variant === "bill_share" && result && (
        <BillSharePriceNote data={data} dataset={dataset} result={result} />
      )}
      {dataset === "efrs_1573" &&
        variant === "bill_share" &&
        result &&
        published && (
          <div className="mt-3">
            <Warning>
              Some Enhanced FRS households have no recorded energy spending.
              They receive no bill-share payment: recipients fall from{" "}
              {formatMillions(published.headline.recipients_m, 2)} to{" "}
              {formatMillions(result.headline.recipients_m, 2)} and the average
              payment rises to{" "}
              {formatCurrency(result.headline.average_per_recipient)}. The
              written analysis sets these results aside.
            </Warning>
          </div>
        )}
    </section>
  );
}

const PRICE_LEVEL = {
  microcosm_979: {
    label: "2024-25 prices",
    source: "ofgem_cap_fy2024_25",
    key: "mean",
  },
  efrs_1573: {
    label: "April–June 2026 unit rates",
    source: "ofgem_cap_2026_apr_jun",
    key: "at_2023_tdcv",
  },
};

function BillSharePriceNote({ data, dataset, result }) {
  const source = (id) => (data.external_sources ?? []).find((x) => x.id === id);
  const level = PRICE_LEVEL[dataset];
  const base = level && source(level.source)?.value?.[level.key];
  const winter = source("ofgem_cap_2026_oct_dec")?.value?.at_2023_tdcv;
  if (!base || !winter) return null;
  const uplift = winter / base;
  const rate = result.schedule.rates.find((r) => r > 0);
  return (
    <div className="mt-3 border-t border-slate-200 pt-3 text-sm text-slate-600">
      <p>
        Bill-share estimates use {level.label}; the October–December 2026 cap is{" "}
        {formatShare(uplift - 1)} higher.
      </p>
      <Disclosure title="What the price level changes">
        <p>
          The rates match the published averages on this dataset&apos;s bills.
          At the winter cap, the same rates would pay about{" "}
          {formatShare(uplift - 1)} more.{" "}
          {rate
            ? `Matching the averages would take about ${((100 * rate) / uplift).toFixed(1)}% rather than ${(100 * rate).toFixed(1)}% for the first tier.`
            : ""}{" "}
          Bill share includes standing charges; the proposal discounts unit
          prices.
        </p>
      </Disclosure>
    </div>
  );
}
