"""Profit estimation from yield and crop economics."""

from __future__ import annotations

from utils.constants import CROP_COST_PER_HA_INR, CROP_MSP_INR_PER_QUINTAL, DEFAULT_CROP_KEY


def normalize_crop(name: str) -> str:
    k = name.strip().lower().replace(" ", "_")
    if k in CROP_MSP_INR_PER_QUINTAL:
        return k
    return DEFAULT_CROP_KEY


def estimate_profit_inr(crop: str, yield_per_ha: float, area_ha: float) -> dict:
    """
    profit = (yield_t_per_ha * area * price_per_tonne) - (cost_per_ha * area)
    MSP is per quintal (100 kg); 1 tonne = 10 quintals.
    """
    c = normalize_crop(crop)
    price_per_quintal = float(CROP_MSP_INR_PER_QUINTAL[c])
    cost_per_ha = float(CROP_COST_PER_HA_INR[c])

    yield_t = float(yield_per_ha) * float(area_ha)
    quintals = yield_t * 10.0
    revenue = quintals * price_per_quintal
    cost = cost_per_ha * float(area_ha)
    profit = revenue - cost
    return {
        "crop": c,
        "revenue_inr": round(revenue, 2),
        "cost_inr": round(cost, 2),
        "profit_inr": round(profit, 2),
        "currency": "INR",
        "assumptions": {
            "price_basis": "MSP illustrative (per quintal)",
            "cost_basis": "Illustrative cost per hectare",
        },
    }
