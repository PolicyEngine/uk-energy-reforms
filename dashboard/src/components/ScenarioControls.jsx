"use client";

import {
  PRESET_NOTES,
  PRESET_ORDER,
  describeSchedule,
  getResult,
  yearLabel,
} from "../lib/dataHelpers";
import { formatShare } from "../lib/formatters";
import { Disclosure, Toggle } from "./ui";

const VARIANT_NOTES = {
  published:
    "Fixed payments based on the Resolution Foundation's published averages. Total cost depends on how many households qualify.",
  budget_2bn:
    "The same payment pattern, adjusted to a total cost of £2bn in the selected year.",
  bill_share:
    "A percentage of each household's gas and electricity bill, calibrated to the published average payments.",
};

function OptionList({ heading, selected, items }) {
  return (
    <div>
      <p className="eyebrow mb-2 text-slate-500">{heading}</p>
      <ul className="space-y-2">
        {items.map(({ value, label, note }) => (
          <li
            key={value}
            className={`option-card ${value === selected ? "active" : ""}`}
            aria-current={value === selected ? "true" : undefined}
          >
            <p className="font-semibold text-slate-800">{label}</p>
            {note && <p className="mt-0.5">{note}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ScenarioControls({
  data,
  dataset,
  scenario,
  onChange,
  onMethodology,
}) {
  const { preset, variant, year } = scenario;
  const result = getResult(data, year, preset, variant, dataset);
  return (
    <section aria-label="Selected reform" className="scenario-bar">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.7fr)]">
        <Toggle
          label="Reform option"
          value={preset}
          onChange={(value) => onChange({ preset: value })}
          options={PRESET_ORDER.filter((p) => data.results[year]?.[p]).map(
            (p) => ({ value: p, label: data.meta.presets[p] }),
          )}
        />
        <Toggle
          label="Payment basis"
          value={variant}
          onChange={(value) => onChange({ variant: value })}
          options={Object.entries(data.meta.variants).map(([value, label]) => ({
            value,
            label,
          }))}
        />
        <Toggle
          label="Year"
          value={year}
          onChange={(value) => onChange({ year: value })}
          options={data.meta.years.map((y) => ({
            value: y,
            label: yearLabel(data, y),
          }))}
        />
      </div>
      <p aria-live="polite" className="scenario-summary">
        {result && describeSchedule(result.schedule)}
      </p>
      <Disclosure title="How the options differ" className="mt-2">
        <div className="grid gap-6 md:grid-cols-2">
          <OptionList
            heading="Reform options"
            selected={preset}
            items={PRESET_ORDER.map((p) => ({
              value: p,
              label: data.meta.presets[p],
              note: PRESET_NOTES[p],
            }))}
          />
          <OptionList
            heading="Payment basis"
            selected={variant}
            items={Object.entries(data.meta.variants).map(([v, label]) => ({
              value: v,
              label,
              note: VARIANT_NOTES[v],
            }))}
          />
        </div>
        <div className="options-footer">
          <p>
            {yearLabel(data, data.meta.years[0])} includes January to March
            2027, the proposed winter window. Amounts are the total discount,
            not a monthly payment.
          </p>
          <button type="button" onClick={onMethodology} className="text-link">
            Read the modelling assumptions →
          </button>
        </div>
      </Disclosure>
      {variant === "bill_share" && result && (
        <BillSharePriceNote data={data} dataset={dataset} result={result} />
      )}
    </section>
  );
}

const PRICE_LEVEL = {
  microcosm_national: {
    label: "2024-25 prices",
    source: "ofgem_cap_fy2024_25",
    key: "mean",
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
