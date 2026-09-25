import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { boundLabel, crosstabKey, distributionKey, heatBin } from "./distributions";

const DATA = join(import.meta.dir, "..", "..", "public", "data");
const data = JSON.parse(readFileSync(join(DATA, "targeted_energy_discount_results.json")));

describe("distribution helpers", () => {
  test("keys", () => {
    expect(distributionKey("eq", "ahc")).toBe("eq_ahc");
    expect(distributionKey("taxable", "ahc")).toBe("taxable");
    expect(crosstabKey("bhc", "taxable")).toBe("eq_bhc|taxable");
    expect(crosstabKey("ahc", "net")).toBe("eq_ahc|net_ahc");
  });

  test("heat bins", () => {
    expect(heatBin(0, 1)).toBe(0);
    expect(heatBin(0.5, 1)).toBe(2);
    expect(heatBin(1, 1)).toBe(4);
    expect(heatBin(null, 1)).toBe(null);
    expect(heatBin(0.2, 0)).toBe(null);
  });

  test("income ranges", () => {
    const cuts = [10_000, 20_000, 30_000, 40_000];
    expect(boundLabel(cuts, 1, 5)).toBe("below £10,000");
    expect(boundLabel(cuts, 3, 5)).toBe("£20,000 to £30,000");
    expect(boundLabel(cuts, 5, 5)).toBe("£40,000 and above");
  });
});

describe("exported income distributions", () => {
  const blocks = Object.entries(data.distributions ?? {}).flatMap(([year, byPreset]) =>
    Object.entries(byPreset).flatMap(([preset, byDataset]) =>
      Object.entries(byDataset).map(([dataset, block]) => ({ year, preset, dataset, block })),
    ),
  );

  test("every scheme year and published preset has a block", () => {
    for (const year of data.meta.years) {
      for (const preset of Object.keys(data.meta.presets)) {
        expect(data.distributions?.[year]?.[preset]?.microcosm_979).toBeDefined();
      }
    }
  });

  for (const { year, preset, dataset, block } of blocks) {
    const schedule = data.results[year][preset][dataset].schedule;
    test(`${year} ${preset} ${dataset}: shares add up`, () => {
      for (const dist of Object.values(block.distributions)) {
        for (const d of dist.deciles) {
          expect(d.passported + d.income_only + d.not_eligible).toBeCloseTo(1, 2);
          if (!schedule.income_test) expect(d.income_only).toBe(0);
        }
        const spending = dist.deciles.reduce((sum, d) => sum + (d.cost_share ?? 0), 0);
        expect(spending).toBeCloseTo(1, 2);
      }
      for (const crosstab of Object.values(block.crosstabs)) {
        const households = crosstab.cells.reduce((sum, c) => sum + c.household_share, 0);
        expect(households).toBeCloseTo(1, 2);
        expect(crosstab.cells).toHaveLength(25);
      }
    });
  }
});
