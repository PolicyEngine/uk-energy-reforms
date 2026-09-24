"""Turn published averages into unit rates, or rescale a schedule to a budget.

RF's scheme discounts unit prices, so support rises with consumption; its 175 GBP (flat)
and 220 / 85 GBP (tiered) figures are averages across eligible households. These helpers
derive, from a fixed-amount run on a given dataset, the unit rates that reproduce those
averages tier by tier, and rescale any schedule to a total cost.
"""

from __future__ import annotations

import numpy as np

from uk_energy_reforms.reforms.targeted_energy_discount.presets import P
from uk_energy_reforms.simulate import Run


def _paid_bracket(frame, thresholds):
    """Schedule bracket each household is paid under (by assessed income)."""
    return (
        np.searchsorted(np.asarray(thresholds), frame.assessed_income, side="right") - 1
    )


def unit_rate_changes(fixed: Run) -> dict:
    """Parameter changes for a unit-rate schedule matching ``fixed``'s tier averages.

    For each paying bracket, the rate is the bracket's fixed amount divided by the
    weighted mean bill of households paid in that bracket, so average support per
    recipient in each bracket is unchanged while individual support scales with the
    household's bill. Brackets paying the same amount share one rate.
    """
    s = fixed.schedule
    if s["unit_rate"]:
        raise ValueError("unit_rate_changes expects a fixed-amount run")
    f = fixed.frame[fixed.frame.discount > 0]
    bracket = _paid_bracket(f, s["thresholds"])
    changes = dict(fixed.changes)
    changes[f"{P}.unit_rate.in_effect"] = True
    amounts = np.asarray(s["amounts"])
    for i, (threshold, amount) in enumerate(zip(s["thresholds"], amounts)):
        changes[f"{P}.unit_rate.rate[{i}].threshold"] = threshold
        same = np.isin(bracket, np.flatnonzero(amounts == amount))
        if amount <= 0 or not same.any():
            rate = 0.0
        else:
            bills = f.bill.values[same]
            weights = f.weight.values[same]
            rate = float(amount / np.average(bills, weights=weights))
        changes[f"{P}.unit_rate.rate[{i}].amount"] = rate
    return changes


def cost(run: Run) -> float:
    f = run.frame[run.frame.gb]
    return float((f.discount * f.weight).sum())


def budget_changes(run: Run, budget: float) -> dict:
    """Parameter changes scaling ``run``'s schedule so its cost equals ``budget``."""
    factor = budget / cost(run)
    s = run.schedule
    changes = dict(run.changes)
    if s["unit_rate"]:
        for i, rate in enumerate(s["rates"]):
            changes[f"{P}.unit_rate.rate[{i}].amount"] = rate * factor
    else:
        for i, amount in enumerate(s["amounts"]):
            changes[f"{P}.amount[{i}].amount"] = amount * factor
    return changes
