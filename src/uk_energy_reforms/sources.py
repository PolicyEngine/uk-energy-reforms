"""Single registry of every non-PolicyEngine number shown beside the model's baseline.

Modelled quantities come from the simulations and are never written here. External
figures (official statistics and other organisations' estimates) live here with a
value, the period and geography they describe, and the source URL, and are emitted
verbatim into the dashboard data so the page renders no hard-coded numbers. The
Resolution Foundation's figures for the proposal itself are in ``rf_comparison``.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from importlib.resources import files
from typing import Any


@dataclass(frozen=True)
class Source:
    id: str
    quantity: str
    value: Any
    unit: str
    period: str
    geography: str
    publisher: str
    title: str
    url: str
    note: str = ""


def _load() -> list[Source]:
    """The vendored registry: each entry was read from the URL it cites (September 2026),
    with derived values (sums, annualisations) marked as such in the note."""
    raw = json.loads(
        files("uk_energy_reforms").joinpath("external_sources.json").read_text()
    )
    return [Source(**entry) for entry in raw]


EXTERNAL_SOURCES: list[Source] = _load()
