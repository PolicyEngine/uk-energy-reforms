import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { boundLabel, distributionKey } from "./distributions";
import { getDistributions, scenarioId } from "./dataHelpers";

const DATA = join(import.meta.dir, "..", "..", "public", "data");
const data = JSON.parse(
  readFileSync(join(DATA, "targeted_energy_discount_results.json")),
);

describe("distribution helpers", () => {
  test("keys", () => {
    expect(distributionKey("eq", "ahc")).toBe("eq_ahc");
    expect(distributionKey("taxable", "ahc")).toBe("taxable");
  });

  test("income ranges", () => {
    const cuts = [10_000, 20_000, 30_000, 40_000];
    expect(boundLabel(cuts, 1, 5)).toBe("below £10,000");
    expect(boundLabel(cuts, 3, 5)).toBe("£20,000 to £30,000");
    expect(boundLabel(cuts, 5, 5)).toBe("£40,000 and above");
  });
});

describe("exported income distributions", () => {
  const blocks = Object.entries(data.distributions ?? {}).flatMap(
    ([year, byPreset]) =>
      Object.entries(byPreset).flatMap(([preset, byDataset]) =>
        Object.entries(byDataset).map(([dataset, block]) => ({
          year,
          preset,
          dataset,
          block,
        })),
      ),
  );

  test("every selectable scenario has its own income distributions", () => {
    for (const year of data.meta.years) {
      for (const preset of Object.keys(data.meta.presets)) {
        for (const variant of Object.keys(data.meta.variants)) {
          for (const dataset of Object.keys(data.meta.datasets)) {
            const block = getDistributions(
              data,
              year,
              preset,
              variant,
              dataset,
            );
            expect(block).toBeDefined();
            const result =
              data.results[year][scenarioId(preset, variant)][dataset];
            const published = getDistributions(
              data,
              year,
              preset,
              "published",
              dataset,
            );
            for (const [measure, dist] of Object.entries(block.distributions)) {
              // Payment bases change spending, but not income ranks or qualification.
              expect(dist.cut_points).toEqual(
                published.distributions[measure].cut_points,
              );
              for (const [index, row] of dist.deciles.entries()) {
                for (const route of [
                  "passported",
                  "income_only",
                  "not_eligible",
                ]) {
                  expect(row[route]).toBe(
                    published.distributions[measure].deciles[index][route],
                  );
                }
              }
              const cost = dist.deciles.reduce(
                (sum, d) => sum + d.households_m * d.average_gain,
                0,
              );
              // Exported cells are rounded to four significant figures (cost here is £m).
              expect(
                Math.abs(cost / (result.headline.cost_bn * 1000) - 1),
              ).toBeLessThan(0.001);
            }
          }
        }
      }
    }
  });

  test("bill-share spending uses its own distribution rather than published amounts", () => {
    const published = getDistributions(
      data,
      "2026",
      "rf_flat",
      "published",
      "microcosm_national",
    );
    const billShare = getDistributions(
      data,
      "2026",
      "rf_flat",
      "bill_share",
      "microcosm_national",
    );
    expect(
      billShare.distributions.eq_bhc.deciles.map((d) => d.cost_share),
    ).not.toEqual(
      published.distributions.eq_bhc.deciles.map((d) => d.cost_share),
    );
  });

  for (const { year, preset, dataset, block } of blocks) {
    const schedule = data.results[year][preset][dataset].schedule;
    test(`${year} ${preset} ${dataset}: shares add up`, () => {
      for (const dist of Object.values(block.distributions)) {
        for (const d of dist.deciles) {
          expect(d.passported + d.income_only + d.not_eligible).toBeCloseTo(
            1,
            2,
          );
          if (!schedule.income_test) expect(d.income_only).toBe(0);
        }
        const spending = dist.deciles.reduce(
          (sum, d) => sum + (d.cost_share ?? 0),
          0,
        );
        expect(spending).toBeCloseTo(1, 2);
      }
    });
  }
});
