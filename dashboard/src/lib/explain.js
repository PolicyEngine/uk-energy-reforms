// The sentence the "Your household" tab shows under the discount table: why a household
// does or does not qualify under one option. Tested against policyengine-uk's own
// eligibility route in calculator.test.js.

export function explain(result, schedule) {
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
