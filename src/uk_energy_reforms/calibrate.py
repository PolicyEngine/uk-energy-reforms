"""Turn published averages into bill shares, or rescale a schedule to a budget.

RF's scheme cuts unit prices (pence per kWh), so support rises with consumption; its
175 GBP (flat) and 220 / 85 GBP (tiered) figures are averages across eligible households.
Neither dataset records kWh, only annual gas and electricity spend (which includes
standing charges), so the closest we can model is a bill-share discount: a percentage off
the household's annual spend. These helpers derive, from a fixed-amount run, the shares
that reproduce the fixed amounts' averages, and rescale any schedule to a total cost.
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


def bill_share_changes(fixed: Run) -> dict:
    """Parameter changes for a bill-share schedule matching ``fixed``'s averages.

    Brackets paying the same fixed amount share one rate: that amount divided by the
    weighted mean bill of all households paid at it. Average support per recipient is
    therefore unchanged across each such group of brackets combined, not within each
    bracket (a flat schedule has one rate for everyone, so its brackets can average
    different amounts). Individual support scales with the household's bill.
    """
    s = fixed.schedule
    if s["bill_share"]:
        raise ValueError("bill_share_changes expects a fixed-amount run")
    f = fixed.frame[fixed.frame.discount > 0]
    bracket = _paid_bracket(f, s["thresholds"])
    changes = dict(fixed.changes)
    changes[f"{P}.bill_share.in_effect"] = True
    amounts = np.asarray(s["amounts"])
    for i, (threshold, amount) in enumerate(zip(s["thresholds"], amounts)):
        changes[f"{P}.bill_share.rate[{i}].threshold"] = threshold
        same = np.isin(bracket, np.flatnonzero(amounts == amount))
        if amount <= 0 or not same.any():
            rate = 0.0
        else:
            bills = f.bill.values[same]
            weights = f.weight.values[same]
            rate = float(amount / np.average(bills, weights=weights))
        changes[f"{P}.bill_share.rate[{i}].amount"] = rate
    return changes


def cost(run: Run) -> float:
    f = run.frame[run.frame.gb]
    return float((f.discount * f.weight).sum())


def budget_changes(run: Run, budget: float) -> dict:
    """Parameter changes scaling ``run``'s schedule so its cost equals ``budget``."""
    factor = budget / cost(run)
    s = run.schedule
    changes = dict(run.changes)
    if s["bill_share"]:
        for i, rate in enumerate(s["rates"]):
            changes[f"{P}.bill_share.rate[{i}].amount"] = rate * factor
    else:
        for i, amount in enumerate(s["amounts"]):
            changes[f"{P}.amount[{i}].amount"] = amount * factor
    return changes
