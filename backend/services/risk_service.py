"""Risk scoring from environmental signals."""

from __future__ import annotations

from typing import Literal

RiskLevel = Literal["LOW", "MEDIUM", "HIGH"]


def rainfall_risk_band(rainfall: float) -> tuple[RiskLevel, str]:
    """
    Spec: Low rainfall → HIGH risk; medium → MEDIUM; high → LOW.
    """
    if rainfall < 600:
        return "HIGH", "Below-normal rainfall increases moisture stress risk."
    if rainfall < 1200:
        return "MEDIUM", "Rainfall is moderate — monitor irrigation and pest pressure."
    return "LOW", "Adequate rainfall reduces water-stress risk."


def composite_risk(rainfall: float, temperature: float) -> dict:
    level, reason = rainfall_risk_band(rainfall)
    score = {"HIGH": 85, "MEDIUM": 55, "LOW": 25}[level]
    if temperature > 36:
        score = min(95, score + 10)
        reason += " Heat stress may amplify risk."
    return {
        "risk": level,
        "risk_score": score,
        "explanation": reason,
    }
