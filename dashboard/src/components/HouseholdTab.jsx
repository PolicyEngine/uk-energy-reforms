"use client";

import { useState } from "react";
import {
  supportCurve,
  supportSteps,
  targetedEnergyDiscount,
} from "../lib/calculator";
import { explain } from "../lib/explain";
import {
  PRESET_ORDER,
  getBaseline,
  getResult,
  yearLabel,
} from "../lib/dataHelpers";
import { formatCurrency } from "../lib/formatters";
import SupportByIncomeChart from "./charts/SupportByIncomeChart";
import ChartLogo from "./ChartLogo";
import SectionHeading from "./SectionHeading";
import { Disclosure, Note, Table, Toggle } from "./ui";

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

export default function HouseholdTab({
  data,
  calculator,
  dataset,
  scenario,
  savedState,
  onSaveState,
  onMethodology,
}) {
  const { year, preset, variant } = scenario;
  const baseline = getBaseline(data, year, dataset);
  const example = {
    region: "NORTH_WEST",
    adultIncomes: [19_000],
    youngChildren: 0,
    olderChildren: 0,
    benefits: {},
    bill: Math.round(baseline?.mean_bill ?? 1_500),
  };
  const draft = savedState?.draft ?? example;
  const household = savedState?.household ?? example;
  const [varied, setVaried] = useState(0);
  const edit = (patch) =>
    onSaveState({ ...savedState, draft: { ...draft, ...patch }, household });
  const pending = !sameHousehold(draft, household);
  const scale = calculator?.equivalisation;

  const inputs = {
    ...household,
    passported: Object.values(household.benefits).some(Boolean),
  };

  const rows = PRESET_ORDER.map((option) => {
    const row = { key: option, preset: data.meta.presets[option] };
    for (const basis of VARIANT_ORDER) {
      const r = getResult(data, year, option, basis, dataset);
      row[basis] =
        r && scale
          ? targetedEnergyDiscount(inputs, r.schedule, scale).amount
          : null;
    }
    return row;
  });
  const focusSchedule = getResult(
    data,
    year,
    preset,
    variant,
    dataset,
  )?.schedule;
  const focusResult =
    focusSchedule && scale
      ? targetedEnergyDiscount(inputs, focusSchedule, scale)
      : null;
  const adult = Math.min(varied, household.adultIncomes.length - 1);
  const current = household.adultIncomes[adult] ?? 0;
  const maxIncome = Math.max(
    60_000,
    Math.ceil((current * 1.5) / 10_000) * 10_000,
  );
  const curve =
    focusSchedule && scale
      ? supportCurve(inputs, focusSchedule, scale, adult, maxIncome)
      : [];
  const steps = supportSteps(curve);

  if (!scale) {
    return (
      <p className="section-card text-sm text-slate-500">
        Calculator data not loaded.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pt-2">
        <SectionHeading
          size="lg"
          title="What would your household get?"
          description="See the payment and eligibility rules for the reform selected above. Start with the example household, or enter your own details."
        />
      </div>

      {focusResult && (
        <section
          aria-label="Selected scenario result"
          className="section-card border-primary-200"
          aria-live="polite"
        >
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <p className="text-sm font-medium text-slate-600">
                {savedState?.calculated
                  ? "Estimated discount"
                  : "Example household’s discount"}
              </p>
              <p className="mt-1 text-4xl font-bold text-primary-700">
                {formatCurrency(focusResult.amount)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Total support · {yearLabel(data, year)}
              </p>
            </div>
            <div className="space-y-2 text-sm leading-6">
              <p className="font-semibold">
                {data.meta.presets[preset]} · {data.meta.variants[variant]}
              </p>
              <p>{explain(focusResult, focusSchedule)}</p>
              {focusResult.eligible && focusSchedule.bill_share && (
                <p>
                  {(100 * focusSchedule.rates[focusResult.tier]).toFixed(1)}% of
                  the household’s {formatCurrency(household.bill)} annual gas
                  and electricity bill.
                </p>
              )}
              {pending && (
                <p className="font-semibold text-amber-700">
                  Inputs have changed. Calculate below to update the household
                  used for these results.
                </p>
              )}
            </div>
          </div>
        </section>
      )}
      <section className="section-card space-y-5">
        <SectionHeading title="Household details" />
        <Disclosure title="What counts as taxable income?">
          <p>
            Enter each adult’s annual taxable income: earnings, pensions
            (including the State Pension), property, savings, dividends and
            taxable benefits. Do not add untaxed benefits such as Universal
            Credit. The model uses annual income; the proposal would assess the
            three months before the scheme.
          </p>
        </Disclosure>
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
                      edit({
                        adultIncomes: draft.adultIncomes.map((x, j) =>
                          j === i ? v : x,
                        ),
                      })
                    }
                  />
                </div>
                {draft.adultIncomes.length > 1 && (
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={() =>
                      edit({
                        adultIncomes: draft.adultIncomes.filter(
                          (_, j) => j !== i,
                        ),
                      })
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
                onClick={() =>
                  edit({ adultIncomes: [...draft.adultIncomes, 0] })
                }
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
              <legend className="mb-1 font-medium">
                Does anyone in the household receive…
              </legend>
              {BENEFITS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(draft.benefits[key])}
                    onChange={(e) =>
                      edit({
                        benefits: {
                          ...draft.benefits,
                          [key]: e.target.checked,
                        },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            {variant === "bill_share" && (
              <div className="space-y-2">
                <NumberField
                  label="Annual gas and electricity bill"
                  value={draft.bill}
                  step={50}
                  prefix="£"
                  onChange={(v) => edit({ bill: v })}
                />
                <p className="text-xs leading-5 text-slate-500">
                  The bill starts at the average GB bill in the model (
                  {formatCurrency(baseline?.mean_bill ?? 0)},{" "}
                  {yearLabel(data, year)}).
                </p>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
          <button
            type="button"
            className="primary-button"
            disabled={!pending}
            onClick={() =>
              onSaveState({ draft, household: draft, calculated: true })
            }
          >
            Calculate
          </button>
          <p className="text-sm text-slate-500" aria-live="polite">
            {pending
              ? "You have changed the household. Press Calculate to update the results."
              : "The results use these household details."}
          </p>
        </div>
      </section>

      <section className="section-card space-y-5">
        <SectionHeading
          title="How support changes with income"
          description={`Support under ${data.meta.presets[preset].toLowerCase()}, using ${data.meta.variants[variant].toLowerCase()}, as one adult’s annual taxable income changes.`}
        />
        <div className="grid gap-5 md:grid-cols-2">
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
          Benefit receipt is held fixed. In practice means-tested benefits fall
          as income rises, so a household passported at its current income may
          not be at a higher one.
        </p>
      </section>
      <section className="section-card">
        <Disclosure title="Compare other options">
          <p>
            Total support in {yearLabel(data, year)} for the household last
            calculated. Bill-share payments use an annual bill of{" "}
            {formatCurrency(household.bill)}; choose Bill share above to edit
            it.
          </p>
          <Table
            columns={[
              { key: "preset", header: "Option" },
              ...VARIANT_ORDER.map((v) => ({
                key: v,
                header: data.meta.variants[v],
                align: "right",
                format: (value) =>
                  value === null ? "n/a" : formatCurrency(value),
              })),
            ]}
            rows={rows}
          />
        </Disclosure>
      </section>
      <button
        className="text-link"
        onClick={() => onMethodology("method-eligibility")}
      >
        How eligibility and payments are modelled →
      </button>
    </div>
  );
}
