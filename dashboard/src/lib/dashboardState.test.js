import { expect, test } from "bun:test";
import data from "../../public/data/targeted_energy_discount_results.json";
import { dashboardQuery, dashboardState } from "./dashboardState";

test("navigation keeps the scenario, eligibility view and dataset in shared links", () => {
  const initial = new URLSearchParams(
    "tab=reform&preset=rf_tiered&variant=bill_share&year=2027&view=eligibility&dataset=efrs_1573",
  );
  const household = new URLSearchParams(
    dashboardQuery(initial, { tab: "household" }),
  );
  const state = dashboardState(household, data, "efrs_1573");
  expect(state).toEqual({
    tab: "household",
    view: "eligibility",
    scenario: { year: "2027", preset: "rf_tiered", variant: "bill_share" },
  });
  expect(household.get("dataset")).toBe("efrs_1573");
  expect(
    dashboardState(
      new URLSearchParams(dashboardQuery(household, { tab: "reform" })),
      data,
      "efrs_1573",
    ).scenario,
  ).toEqual(state.scenario);
});

test("invalid shared links fall back to an available scenario and old report links still work", () => {
  const state = dashboardState(
    new URLSearchParams("tab=report&year=1900&preset=missing&variant=missing"),
    data,
    "microcosm_979",
  );
  expect(state.tab).toBe("baseline");
  expect(state.scenario).toEqual({
    year: data.meta.years[0],
    preset: "rf_flat",
    variant: "published",
  });
});
