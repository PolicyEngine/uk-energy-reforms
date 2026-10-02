import React from "react";
import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import HouseholdTab from "./HouseholdTab";
import data from "../../public/data/targeted_energy_discount_results.json";
import calculator from "../../public/data/calculator.json";

const household = {
  region: "NORTH_WEST",
  adultIncomes: [19_000],
  youngChildren: 0,
  olderChildren: 0,
  benefits: {},
  bill: 2_000,
};

function render(variant) {
  return renderToStaticMarkup(
    <HouseholdTab
      data={data}
      calculator={calculator}
      dataset="microcosm_979"
      scenario={{ year: "2027", preset: "rf_tiered", variant }}
      savedState={{ draft: household, household, calculated: true }}
      onSaveState={() => {}}
      onMethodology={() => {}}
    />,
  );
}

test("selected payment basis drives both the household headline and income curve", () => {
  const fixed = render("published");
  const billShare = render("bill_share");
  const hero = (html) =>
    html
      .split('aria-label="Selected scenario result"')[1]
      .split("</section>")[0];
  expect(hero(fixed)).toContain("£85");
  expect(hero(billShare)).toContain("£128");
  expect(fixed).toContain("£85 from £18,000 to £23,999");
  expect(billShare).toContain("£128 from £18,000 to £23,999");
});
