"""Resolution Foundation targeted energy discount ("Billing me softly", August 2026)."""

from uk_energy_reforms.reforms.targeted_energy_discount.presets import (
    DESCRIPTIONS,
    PRESETS,
    preset,
)
from uk_energy_reforms.reforms.targeted_energy_discount.reform import (
    apply_parameter_changes,
    install,
    scenario,
)
from uk_energy_reforms.reforms.targeted_energy_discount.variables import PARAMETER_PATH

__all__ = [
    "DESCRIPTIONS",
    "PARAMETER_PATH",
    "PRESETS",
    "apply_parameter_changes",
    "install",
    "preset",
    "scenario",
]
