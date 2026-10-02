import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { supportCurve, supportSteps, targetedEnergyDiscount } from "./calculator";
import { explain } from "./explain";

const DATA = join(import.meta.dir, "..", "..", "public", "data");
const results = JSON.parse(readFileSync(join(DATA, "targeted_energy_discount_results.json")));
const reference = JSON.parse(readFileSync(join(DATA, "calculator.json")));

const year = String(reference.year);
const dataset = "microcosm_979";
const schedules = Object.fromEntries(
  ["rf_flat", "rf_tiered", "rf_tiered_own_income", "rf_household_income", "passport_only"].map(
    (p) => [p, results.results[year][p][dataset].schedule],
  ),
);
schedules.rf_tiered_bill_share = {
  ...schedules.rf_tiered,
  bill_share: true,
  rate_thresholds: schedules.rf_tiered.thresholds,
  rates: reference.bill_share_rates,
};

describe("household calculator matches policyengine-uk", () => {
  for (const c of reference.cases) {
    const household = {
      adultIncomes: c.adult_incomes,
      youngChildren: c.young_children,
      olderChildren: c.older_children,
      passported: c.passported,
      region: c.region,
      bill: c.bill,
    };
    for (const [name, expected] of Object.entries(c.expected)) {
      test(`${c.id} under ${name}`, () => {
        const result = targetedEnergyDiscount(household, schedules[name], reference.equivalisation);
        expect(result.amount).toBeCloseTo(expected, 2);
      });
      const route = c.routes[name];
      test(`${c.id} under ${name}: eligibility route and sentence`, () => {
        const schedule = schedules[name];
        const result = targetedEnergyDiscount(household, schedule, reference.equivalisation);
        expect(result.eligible).toBe(route.eligible);
        expect(result.incomeRoute).toBe(route.income_route);
        expect(result.tested).toBeCloseTo(route.tested_income, 2);
        const sentence = explain(result, schedule);
        if (!result.inScope) {
          expect(sentence).toStartWith("Households in Northern Ireland are outside the scheme");
        } else if (result.passported) {
          expect(sentence).toStartWith("The household receives a means-tested benefit");
        } else if (route.eligible) {
          expect(sentence).toStartWith("The household qualifies through the income test");
        } else {
          expect(sentence).toMatch(/does not qualify|passports benefit recipients only/);
        }
      });
    }
  }
});

describe("support by income", () => {
  const flat = schedules.rf_flat;
  const tiered = schedules.rf_tiered;
  const scale = reference.equivalisation;
  const single = {
    adultIncomes: [19_000],
    youngChildren: 0,
    olderChildren: 0,
    passported: false,
    region: "NORTH_WEST",
    bill: 1_500,
  };

  test("the flat option stops at £24,000", () => {
    const steps = supportSteps(supportCurve(single, flat, scale, 0, 40_000));
    expect(steps.map((s) => [s.from, s.amount])).toEqual([
      [0, 175],
      [24_000, 0],
    ]);
  });

  test("the tiered option drops at £18,000 and stops at £24,000", () => {
    const steps = supportSteps(supportCurve(single, tiered, scale, 0, 40_000));
    expect(steps.map((s) => [s.from, s.amount])).toEqual([
      [0, 220],
      [18_000, 85],
      [24_000, 0],
    ]);
  });

  test("a passported household qualifies at any income", () => {
    const steps = supportSteps(
      supportCurve({ ...single, passported: true }, flat, scale, 0, 60_000),
    );
    expect(steps).toHaveLength(1);
    expect(steps[0].amount).toBe(175);
  });

  test("another adult above the line rules out the income test", () => {
    const couple = { ...single, adultIncomes: [10_000, 30_000] };
    const steps = supportSteps(supportCurve(couple, flat, scale, 0, 40_000));
    expect(steps.map((s) => s.amount)).toEqual([0]);
  });

  test("the household option's line depends on the other adults' income", () => {
    const household = schedules.rf_household_income;
    const couple = { ...single, adultIncomes: [0, 20_000] };
    // Equivalised household income reaches £30,000 when the two incomes sum to £30,000 × 1.
    const steps = supportSteps(supportCurve(couple, household, scale, 0, 40_000));
    expect(steps.map((s) => [s.from, s.amount])).toEqual([
      [0, 175],
      [Math.ceil(30_000 * (scale.first_adult + scale.other_adult) - 20_000), 0],
    ]);
  });
});
