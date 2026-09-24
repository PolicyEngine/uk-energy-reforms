// The targeted energy discount for one household, following the reform's rules in
// uk_energy_reforms/reforms/targeted_energy_discount/variables.py. The dashboard's
// test checks this against households computed by policyengine-uk itself.

function bracket(value, thresholds) {
  let index = 0;
  thresholds.forEach((threshold, i) => {
    if (value >= threshold) index = i;
  });
  return index;
}

export function equivalisationFactor(household, scale) {
  const adults = household.adultIncomes.length;
  return (
    scale.first_adult +
    scale.other_adult * Math.max(adults - 1, 0) +
    scale.child_14_plus * (household.olderChildren ?? 0) +
    scale.child_under_14 * (household.youngChildren ?? 0)
  );
}

/**
 * household: { adultIncomes: number[], youngChildren, olderChildren, passported,
 *              region, bill }
 * schedule:  a resolved schedule from the results (thresholds, amounts, rates,
 *            bill_share, income_test, household_equivalised, passport_assessed_income)
 */
export function targetedEnergyDiscount(household, schedule, scale) {
  const incomes = household.adultIncomes.map((v) => Math.max(Number(v) || 0, 0));
  const highest = incomes.length ? Math.max(...incomes) : 0;
  const factor = equivalisationFactor(household, scale);
  const tested = schedule.household_equivalised
    ? incomes.reduce((sum, v) => sum + v, 0) / factor
    : highest;
  const thresholds = schedule.bill_share ? schedule.rate_thresholds : schedule.thresholds;
  const values = schedule.bill_share ? schedule.rates : schedule.amounts;
  const pays = (income) => values[bracket(income, thresholds)] > 0;

  const inScope = household.region !== "NORTHERN_IRELAND";
  const passported = Boolean(household.passported);
  const incomeRoute = schedule.income_test !== false && pays(tested);
  const eligible = schedule.in_effect !== false && inScope && (passported || incomeRoute);
  const assessed = passported ? Math.min(tested, schedule.passport_assessed_income) : tested;
  const tier = bracket(assessed, thresholds);
  const support = schedule.bill_share
    ? values[tier] * Math.max(Number(household.bill) || 0, 0)
    : values[tier];
  return {
    amount: eligible ? support : 0,
    eligible,
    inScope,
    passported,
    incomeRoute,
    highest,
    tested,
    assessed,
    tier,
    equivalisationFactor: factor,
  };
}
