"""Household types for breakdowns, aligned with RF's family types (Figure 4).

A household with one benefit unit takes that unit's type; pensioner units are those
with an adult over State Pension age and no dependent children (a pensioner with a
dependent child counts as a lone parent or couple with children). Households with
more than one benefit unit (adult children living with parents, sharers) are grouped
separately: the highest-individual-income test treats them very differently from a
household-income test.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

HOUSEHOLD_TYPES = [
    "Single pensioner",
    "Pensioner couple",
    "Single, no children",
    "Couple, no children",
    "Lone parent",
    "Couple with children",
    "Multi-family household",
]


def classify(person: pd.DataFrame) -> pd.Series:
    """Household type per household_id.

    ``person`` needs columns household_id, benunit_id, is_child (bool) and
    sp_age (bool, over State Pension age).
    """
    p = person.assign(
        adult=~person.is_child,
        sp_adult=person.sp_age & ~person.is_child,
    )
    g = p.groupby("household_id")
    n_benunits = g.benunit_id.nunique()
    adults = g.adult.sum()
    children = g.is_child.sum()
    pensioner = g.sp_adult.any()
    kind = np.select(
        [
            n_benunits > 1,
            pensioner & (children == 0) & (adults <= 1),
            pensioner & (children == 0),
            (children == 0) & (adults <= 1),
            children == 0,
            adults <= 1,
        ],
        [
            "Multi-family household",
            "Single pensioner",
            "Pensioner couple",
            "Single, no children",
            "Couple, no children",
            "Lone parent",
        ],
        default="Couple with children",
    )
    return pd.Series(kind, index=n_benunits.index, name="household_type")
