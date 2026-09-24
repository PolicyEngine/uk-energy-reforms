"use client";

import { useMemo, useState } from "react";
import { targetedEnergyDiscount } from "../lib/calculator";
import {
  DATASET_ORDER,
  DATASET_SHORT,
  PRESET_ORDER,
  getBaseline,
  getResult,
  yearLabel,
} from "../lib/dataHelpers";
import { formatCurrency } from "../lib/formatters";
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

function explain(result, schedule) {
  const gbp = (v) => `£${Math.round(v).toLocaleString("en-GB")}`;
  if (!result.inScope) {
    return "Households in Northern Ireland are outside the scheme: their bills are not covered by Ofgem's price cap.";
  }
  const line = schedule.thresholds[schedule.thresholds.length - 1];
  const tested = schedule.household_equivalised
    ? `equivalised household income (${gbp(result.tested)}, total taxable income divided by ${result.equivalisationFactor.toFixed(2)})`
    : `highest individual taxable income (${gbp(result.tested)})`;
  const gap = result.tested - line;
  const position =
    gap < 0 ? `${gbp(-gap)} below the ${gbp(line)} line` : `${gbp(gap)} above the ${gbp(line)} line`;
  if (result.passported) {
    return `The household receives a means-tested benefit, so it qualifies whatever its income. Its ${tested} is ${position}.`;
  }
  if (!schedule.income_test) {
    return "This option passports benefit recipients only, and the household does not receive a passporting benefit.";
  }
  return result.incomeRoute
    ? `The household qualifies through the income test: its ${tested} is ${position}.`
    : `The household does not qualify: its ${tested} is ${position}, and it does not receive a passporting benefit.`;
}

export default function HouseholdTab({ data, calculator }) {
  const [year, setYear] = useState(data.meta.years[0]);
  const [dataset, setDataset] = useState(DATASET_ORDER[0]);
  const [region, setRegion] = useState("NORTH_WEST");
  const [adults, setAdults] = useState([19_000]);
  const [youngChildren, setYoungChildren] = useState(0);
  const [olderChildren, setOlderChildren] = useState(0);
  const [benefits, setBenefits] = useState({});
  const baseline = getBaseline(data, year, dataset);
  const [bill, setBill] = useState(() => Math.round(baseline?.mean_bill ?? 1_500));
  const [focus, setFocus] = useState("rf_flat");

  const household = {
    adultIncomes: adults,
    youngChildren,
    olderChildren,
    passported: Object.values(benefits).some(Boolean),
    region,
    bill,
  };
  const scale = calculator?.equivalisation;

  const rows = useMemo(
    () =>
      PRESET_ORDER.map((preset) => {
        const row = { key: preset, preset: data.meta.presets[preset] };
        for (const variant of VARIANT_ORDER) {
          const r = getResult(data, year, preset, variant, dataset);
          row[variant] = r && scale ? targetedEnergyDiscount(household, r.schedule, scale).amount : null;
        }
        return row;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, year, dataset, JSON.stringify(household), scale],
  );

  const focusSchedule = getResult(data, year, focus, "published", dataset)?.schedule;
  const focusResult =
    focusSchedule && scale ? targetedEnergyDiscount(household, focusSchedule, scale) : null;

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
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {adults.map((income, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1">
                  <NumberField
                    label={`Adult ${i + 1}: taxable income (£ a year)`}
                    value={income}
                    prefix="£"
                    onChange={(v) => setAdults(adults.map((x, j) => (j === i ? v : x)))}
                  />
                </div>
                {adults.length > 1 && (
                  <button
                    type="button"
                    className="toggle-button"
                    onClick={() => setAdults(adults.filter((_, j) => j !== i))}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            {adults.length < 6 && (
              <button type="button" className="toggle-button" onClick={() => setAdults([...adults, 0])}>
                Add another adult
              </button>
            )}
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="Children under 14" value={youngChildren} step={1} onChange={setYoungChildren} />
              <NumberField label="Children aged 14 to 17" value={olderChildren} step={1} onChange={setOlderChildren} />
            </div>
            <fieldset className="space-y-2 text-sm text-slate-700">
              <legend className="mb-1 font-medium">Does anyone in the household receive…</legend>
              {BENEFITS.map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(benefits[key])}
                    onChange={(e) => setBenefits({ ...benefits, [key]: e.target.checked })}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
            <NumberField label="Annual gas and electricity bill" value={bill} step={50} prefix="£" onChange={setBill} />
            <p className="text-xs leading-5 text-slate-500">
              The bill only matters for the bill-share amounts. It starts at the average GB
              bill in the model ({formatCurrency(baseline?.mean_bill ?? 0)}, {DATASET_SHORT[dataset]},{" "}
              {yearLabel(data, year)}).
            </p>
          </div>
        </div>
      </section>

      <section className="section-card space-y-5">
        <SectionHeading
          title="Your discount under each option"
          description="Pounds for the year. Scaled-to-£2bn and bill-share amounts depend on the dataset and year they are calibrated on."
        />
        <div className="grid gap-5 md:grid-cols-2">
          <Toggle
            label="Year"
            value={year}
            onChange={setYear}
            options={data.meta.years.map((y) => ({ value: y, label: yearLabel(data, y) }))}
          />
          <Toggle
            label="Calibrated on"
            value={dataset}
            onChange={setDataset}
            options={DATASET_ORDER.filter((d) => data.meta.datasets[d]).map((d) => ({
              value: d,
              label: DATASET_SHORT[d],
            }))}
          />
        </div>
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
          The model assesses annual income; the proposal assesses the three months before the
          scheme starts. The discount would be paid through energy bills, and the amounts are
          the proposal&apos;s averages for a unit-price cut.
        </p>
      </section>
    </div>
  );
}
