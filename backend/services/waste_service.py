"""Crop residue, open-burning emissions (IPCC-style factor), and state-wise sustainability options.

RPR values follow common FAO-style residue-to-product ratio references for major cereals/cane.
Emission factors are illustrative (open-burning scenario) per project specification.
"""

from __future__ import annotations

from typing import Any

# Residue-to-product ratio (tonnes residue per tonne grain/product), by crop
RPR: dict[str, float] = {
    "Wheat": 1.4,
    "Rice": 1.6,
    "Maize": 1.9,
    "Sugarcane": 0.3,
}

DEFAULT_RPR = 1.0

# t CO₂ per tonne residue if burned (project IPCC-style factor)
EMISSION_FACTOR = 1.46

# kg PM2.5 per tonne residue (project factor)
PM25_FACTOR = 5.0

# Illustrative share of CO₂ avoided if residue is managed sustainably (not burned)
REDUCTION_PERCENT = 70

IMPACT_MESSAGE = (
    "Burning crop residue significantly increases air pollution and greenhouse gas emissions."
)

STATE_SOLUTIONS: dict[str, list[str]] = {
    "Punjab": [
        "Bio-CNG production",
        "Paper and packaging industry",
        "Straw-based ethanol plants",
    ],
    "Haryana": [
        "Biomass power plants",
        "Composting and mulching",
    ],
    "Rajasthan": [
        "Animal fodder",
        "Biomass briquettes for fuel",
    ],
    "Maharashtra": [
        "Biogas production",
        "Organic composting",
    ],
    "Uttar Pradesh": [
        "Ethanol production",
        "Biomass energy generation",
    ],
}

_FALLBACK_SOLUTIONS = [
    "In-situ incorporation or composting",
    "Biomass pellets or briquettes for industrial heat",
    "Community biogas or bio-CNG where supply chains exist",
]


def _canonical_crop_name(crop: str) -> str:
    c = str(crop).strip()
    if not c:
        return ""
    return c[0].upper() + c[1:].lower()


def _rpr_for_crop(crop: str) -> float:
    key = _canonical_crop_name(crop)
    if key in RPR:
        return RPR[key]
    for name, r in RPR.items():
        if name.lower() == crop.strip().lower():
            return r
    return DEFAULT_RPR


def calculate_residue(yield_t_per_ha: float, crop: str) -> float:
    """Estimated crop residue in tonnes per hectare: yield (t/ha) × RPR."""
    y = float(yield_t_per_ha)
    if y < 0:
        y = 0.0
    return y * _rpr_for_crop(crop)


def calculate_emissions(residue_tonnes: float) -> dict[str, float]:
    """CO₂ (tonnes) and PM2.5 (kg) if all given residue mass were burned.

    `residue_tonnes` is total residue mass in tonnes (e.g. field-scale).
    """
    r = max(0.0, float(residue_tonnes))
    return {
        "co2_emission": round(r * EMISSION_FACTOR, 2),
        "pm25_emission": round(r * PM25_FACTOR, 2),
    }


def _round2(x: float) -> float:
    return round(max(0.0, float(x)), 2)


def get_state_solutions(state: str) -> list[str]:
    """Region-specific suggested uses; generic list if state is unknown."""
    s = str(state).strip()
    if not s:
        return list(_FALLBACK_SOLUTIONS)
    for name, sols in STATE_SOLUTIONS.items():
        if name.lower() == s.lower():
            return list(sols)
    return list(_FALLBACK_SOLUTIONS)


def build_sustainability_payload(
    yield_t_per_ha: float,
    crop: str,
    state: str,
    area_ha: float,
) -> dict[str, Any]:
    """Per-hectare and field-total residue; open-burning emissions; impact + savings (illustrative)."""
    residue_per_ha = calculate_residue(yield_t_per_ha, crop)
    a = max(0.0, float(area_ha))
    residue_total = residue_per_ha * a

    co2_per_ha = residue_per_ha * EMISSION_FACTOR
    co2_total = residue_total * EMISSION_FACTOR
    pm25_per_ha = residue_per_ha * PM25_FACTOR
    pm25_total = residue_total * PM25_FACTOR
    co2_saved = co2_total * (REDUCTION_PERCENT / 100.0)

    return {
        "residue_per_hectare": _round2(residue_per_ha),
        "residue_generated": _round2(residue_total),
        "co2_per_hectare": _round2(co2_per_ha),
        "co2_emission": _round2(co2_total),
        "pm25_per_hectare": _round2(pm25_per_ha),
        "pm25_emission": _round2(pm25_total),
        "impact_message": IMPACT_MESSAGE,
        "emission_reduction_percent": REDUCTION_PERCENT,
        "co2_saved": _round2(co2_saved),
        "waste_solutions": get_state_solutions(state),
        "sustainability_source": "FAO & IPCC standard factors",
    }
