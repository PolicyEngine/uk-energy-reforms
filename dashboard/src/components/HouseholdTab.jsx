"use client";

import { useMemo, useState } from "react";
import { supportCurve, supportSteps, targetedEnergyDiscount } from "../lib/calculator";
import { explain } from "../lib/explain";
import { PRESET_ORDER, getBaseline, getResult, yearLabel } from "../lib/dataHelpers";
import { formatCurrency } from "../lib/formatters";
import SupportByIncomeChart from "./charts/SupportByIncomeChart";
import ChartLogo from "./ChartLogo";
import SectionHeading from "./SectionHeading";
import { Note, Table, Toggle } from "./ui";

const REGIONS = [
  ["NORTH_EAST", "North East"],
  ["NORTH_WEST", "North West"],
  ["YORKSHIRE", "Yorkshire and the Humber"],
  ["EAST_MIDLANDS", "East Midlands"],
  ["WEST_MIDLANDS", "West Midlands"],
  ["EAST_OF_ENGLAND", "East of England"],
  ["LONDON", "London"],
  ["SOUTH_EAST", "South East"],
  ["SOUTH_WEST", "South West"],
  ["WALES", "Wales"],
  ["SCOTLAND", "Scotland"],
  ["NORTHERN_IRELAND", "Northern Ireland"],
];

const BENEFITS = [
  ["universal_credit", "Universal Credit"],
  ["pension_credit", "Pension Credit"],
  ["housing_benefit", "Housing Benefit"],
  ["esa_income", "Income-related Employment and Support Allowance"],
  ["jsa_income", "Income-based Jobseeker's Allowance"],
  ["income_support", "Income Support"],
];

const VARIANT_ORDER = ["published", "budget_2bn", "bill_share"];

function NumberField({ label, value, onChange, step = 1000, min = 0, prefix }) {
  return (
    <label className="block text-sm text-slate-700">
      <span className="mb-1 block font-medium">{label}</span>
      <span className="flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5">
        {prefix && <span className="mr-1 text-slate-500">{prefix}</span>}
        <input
          type="number"
          className="w-full bg-transparent outline-none"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(Math.max(Number(e.target.value) || 0, min))}
        />
      </span>
    </label>
  );
}

const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;

/** Plain description of the steps along a support curve. */
function describeSteps(steps) {
  if (steps.length === 1) {
    return steps[0].amount > 0
      ? `${gbp(steps[0].amount)} at every income shown.`
      : "No support at any income shown.";
  }
  const parts = steps.map((s, i) => {
    const value = s.amount > 0 ? gbp(s.amount) : "no support";
    if (i === 0) return `${value} up to ${gbp(steps[1].from - 1)}`;
    if (s.to == null) return `${value} from ${gbp(s.from)}`;
    return `${value} from ${gbp(s.from)} to ${gbp(steps[i + 1].from - 1)}`;
  });
  return `${parts.join("; ")}.`;
}

function sameHousehold(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export default function HouseholdTab({ data, calculator, dataset }) {
  const [year, setYear] = useState(data.meta.years[0]);
  const baseline = getBaseline(data, year, dataset);
  const [draft, setDraft] = useState(() => ({
    region: "NORTH_WEST",
    adultIncomes: [19_000],
    youngChildren: 0,
    olderChildren: 0,
    benefits: {},
    bill: Math.round(baseline?.mean_bill ?? 1_500),
  }));
  // Results follow the household as last calculated, not every keystroke.
  const [household, setHousehold] = useState(draft);
  const [focus, setFocus] = useState("rf_flat");
  const [varied, setVaried] = useState(0);
  const edit = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const pending = !sameHousehold(draft, household);
  const scale = calculator?.equivalisation;

  const inputs = {
    ...household,
    passported: Object.values(household.benefits).some(Boolean),
  };

  const rows = useMemo(
    () =>
      PRESET_ORDER.map((preset) => {
        const row = { key: preset, preset: data.meta.presets[preset] };
        for (const variant of VARIANT_ORDER) {
          const r = getResult(data, year, preset, variant, dataset);
          row[variant] =
            r && scale ? targetedEnergyDiscount(inputs, r.schedule, scale).amount : null;
        }
        return row;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, year, dataset, household, scale],
  );

  const focusSchedule = getResult(data, year, focus, "published", dataset)?.schedule;
  const focusResult =
    focusSchedule && scale ? targetedEnergyDiscount(inputs, focusSchedule, scale) : null;
  const adult = Math.min(varied, household.adultIncomes.length - 1);
  const current = household.adultIncomes[adult] ?? 0;
  const maxIncome = Math.max(60_000, Math.ceil((current * 1.5) / 10_000) * 10_000);
  const curve =
    focusSchedule && scale ? supportCurve(inputs, focusSchedule, scale, adult, maxIncome) : [];
  const steps = supportSteps(curve);

  if (!scale) {
    return <p className="section-card text-sm text-slate-500">Calculator data not loaded.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="What would your household get?"
          description="Describe a household to see its discount under each option. The rules follow the proposal: a household qualifies if anyone receives a means-tested benefit, or if the highest taxable income of anyone in it is below the line (or, for the household-income option, equivalised household income is below £30,000). Taxable income includes earnings, pensions (including the State Pension), property, savings, dividends and taxable benefits."
        />
      </div>

      <section className="section-card space-y-5">
        <SectionHeading title="Your household" />
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm text-slate-700">
              <span className="mb-1 block font-medium">Where you live</span>
              <select
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                value={draft.region}
                onChange={(e) => edit({ region: e.target.value })}
              >
                {REGIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {draft.adultIncomes.map((income, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <NumberField
                    label={`Adult ${i + 1}: taxable income (£ a year)`}
                    value={income}
                    prefix="£"
                    onChange={(v) =>
                      edit({ adultIncomes: draft.adultIncomes.map((x, j) => (j === i ? v : x)) })
                    }
                  />
                </div>
                {draft.adultIncomes.length > 1 && (
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={() =>
                      edit({ adultIncomes: draft.adultIncomes.filter((_, j) => j !== i) })
                    }
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {draft.adultIncomes.length < 6 && (
              <button
                type="button"
                className="toggle-button"
                onClick={() => edit({ adultIncomes: [...draft.adultIncomes, 0] })}
              >
                Add another adult
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Children under 14"
                value={draft.youngChildren}
                step={1}
                onChange={(v) => edit({ youngChildren: v })}
              />
              <NumberField
                label="Children aged 14 to 17"
                value={draft.olderChildren}
                step={1}
                onChange={(v) => edit({ olderChildren: v })}
              />
            </div>
            <fieldset className="space-y-2 text-sm text-slate-700">
              <legend className="mb-1 font-medium">Does anyone in the household receive…</legend>
              {BENEFITS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.benefits[key])}
                    onChange={(e) =>
                      edit({ benefits: { ...draft.benefits, [key]: e.target.checked } })
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <NumberField
              label="Annual gas and electricity bill"
              value={draft.bill}
              step={50}
              prefix="£"
              onChange={(v) => edit({ bill: v })}
            />
            <p className="text-xs leading-5 text-slate-500">
              The bill only matters for the bill-share amounts. It starts at the average GB bill in
              the model ({formatCurrency(baseline?.mean_bill ?? 0)}, {yearLabel(data, year)}).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            className="primary-button"
            disabled={!pending}
            onClick={() => setHousehold(draft)}
          >
            Calculate
          </button>
          <p className="text-sm text-slate-500" aria-live="polite">
            {pending
              ? "You have changed the household. Press Calculate to update the results below."
              : "The results below are for this household."}
          </p>
        </div>
      </section>

      <section className="section-card space-y-5">
        <SectionHeading
          title="Your discount under each option"
          description="Pounds for the year. Scaled-to-£2bn and bill-share amounts depend on the year they are calibrated on."
        />
        <Toggle
          label="Year"
          value={year}
          onChange={setYear}
          options={data.meta.years.map((y) => ({ value: y, label: yearLabel(data, y) }))}
        />
        <Table
          columns={[
            { key: "preset", header: "Option" },
            ...VARIANT_ORDER.map((v) => ({
              key: v,
              header: data.meta.variants[v],
              align: "right",
              format: (value) => (value === null ? "n/a" : formatCurrency(value)),
            })),
          ]}
          rows={rows}
        />
        <div className="space-y-3">
          <Toggle
            label="Explain for"
            value={focus}
            onChange={setFocus}
            options={PRESET_ORDER.map((p) => ({ value: p, label: data.meta.presets[p] }))}
          />
          {focusResult && focusSchedule && (
            <Note eyebrow={data.meta.presets[focus]}>
              {explain(focusResult, focusSchedule)} Under RF&apos;s amounts it would receive{" "}
              {formatCurrency(focusResult.amount)}.
            </Note>
          )}
        </div>
        <p className="text-xs leading-5 text-slate-500">
          The model assesses annual income; the proposal assesses the three months before the scheme
          starts. The discount would be paid through energy bills, and the amounts are the
          proposal&apos;s averages for a unit-price cut.
        </p>
      </section>

      <section className="section-card space-y-5">
        <SectionHeading
          title="How support changes with income"
          description="The discount this household would receive under the chosen option, at RF's amounts, as one adult's taxable income changes and everything else stays the same."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            label="Option"
            value={focus}
            onChange={setFocus}
            options={PRESET_ORDER.map((p) => ({ value: p, label: data.meta.presets[p] }))}
          />
          {household.adultIncomes.length > 1 && (
            <Toggle
              label="Change the income of"
              value={adult}
              onChange={setVaried}
              options={household.adultIncomes.map((_, i) => ({
                value: i,
                label: `Adult ${i + 1}`,
              }))}
            />
          )}
        </div>
        {curve.length > 0 && (
          <>
            <SupportByIncomeChart
              curve={curve}
              current={current}
              maxIncome={maxIncome}
              who={`Adult ${adult + 1}`}
            />
            <ChartLogo />
            <Note eyebrow="Along the line">{describeSteps(steps)}</Note>
          </>
        )}
        <p className="text-xs leading-5 text-slate-500">
          Benefit receipt is held fixed. In practice means-tested benefits fall as income rises, so
          a household passported at its current income may not be at a higher one.
        </p>
      </section>
    </div>
  );
}
