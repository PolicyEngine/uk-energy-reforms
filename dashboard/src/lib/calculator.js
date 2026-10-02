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

/**
 * The discount as one adult's taxable income runs from 0 to maxIncome, everything else
 * held fixed (including benefit receipt). Points every `step` pounds, plus the exact
 * incomes where the tested income reaches a schedule line, so steps sit where they occur.
 */
export function supportCurve(household, schedule, scale, adultIndex, maxIncome, step = 100) {
  const others = household.adultIncomes.filter((_, i) => i !== adultIndex);
  const factor = equivalisationFactor(household, scale);
  const lines = (schedule.bill_share ? schedule.rate_thresholds : schedule.thresholds).filter(
    (t) => t > 0,
  );
  const breaks = lines.map((t) =>
    schedule.household_equivalised ? t * factor - others.reduce((sum, v) => sum + v, 0) : t,
  );
  const incomes = new Set();
  for (let x = 0; x <= maxIncome; x += step) incomes.add(x);
  for (const b of breaks) {
    if (b > 0 && b <= maxIncome) {
      incomes.add(Math.ceil(b));
      incomes.add(Math.ceil(b) - 1);
    }
  }
  return [...incomes]
    .sort((a, b) => a - b)
    .map((income) => {
      const adultIncomes = household.adultIncomes.map((v, i) => (i === adultIndex ? income : v));
      return {
        income,
        amount: targetedEnergyDiscount({ ...household, adultIncomes }, schedule, scale).amount,
      };
    });
}

/** Runs of equal support along a curve: [{from, to, amount}], `to` null for the last. */
export function supportSteps(curve) {
  const steps = [];
  for (const point of curve) {
    const last = steps[steps.length - 1];
    if (last && Math.abs(last.amount - point.amount) < 0.005) {
      last.to = point.income;
    } else {
      steps.push({ from: point.income, to: point.income, amount: point.amount });
    }
  }
  if (steps.length) steps[steps.length - 1].to = null;
  return steps;
}
