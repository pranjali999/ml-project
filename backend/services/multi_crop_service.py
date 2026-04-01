"""Compare profit across a fixed set of staple crops for the same agro context."""

from __future__ import annotations

from typing import Any

from services.profit_service import estimate_profit_inr
from services.yield_service import predict_yield_t

# Lowercase names to match training / yield_service
COMPARISON_CROPS = (
    "wheat",
    "rice",
    "maize",
    "soybean",
    "sugarcane",
    "cotton",
    "groundnut",
)


def top_crops_by_profit(
    state: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
    top_n: int = 3,
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for c in COMPARISON_CROPS:
        y = predict_yield_t(state, c, season, rainfall, temperature, area)
        pi = estimate_profit_inr(c, y, area)
        rows.append(
            {
                "crop": str(c).title(),
                "yield": round(float(y), 3),
                "profit": round(float(pi["profit_inr"]), 2),
            }
        )
    rows.sort(key=lambda r: r["profit"], reverse=True)
    return rows[:top_n]
