"""Rule-based agronomic suggestions."""

from __future__ import annotations

from typing import Any


def build_suggestions(
    rainfall: float,
    temperature: float,
    yield_per_ha: float,
    crop: str,
) -> list[str]:
    s: list[str] = []
    if rainfall < 600:
        s.append("Rainfall is on the lower side — consider drip irrigation and moisture conservation.")
    if rainfall > 2000:
        s.append("High rainfall — verify drainage and disease management for your crop stage.")
    if yield_per_ha < 2.0:
        s.append("Yield appears constrained — review soil test, balanced NPK, and micronutrient plan.")
    if temperature > 34:
        s.append("Elevated heat — evaluate heat-tolerant varieties or adjust sowing window.")
    if temperature < 15:
        s.append("Cool conditions — confirm crop suitability and frost/ chilling risk for your region.")
    if not s:
        s.append("Conditions look broadly favorable — continue monitoring soil moisture and pests.")
    return s[:5]


def enrich_from_voice_text(voice_text: str | None) -> list[str]:
    if not voice_text or not str(voice_text).strip():
        return []
    t = voice_text.lower()
    notes: list[str] = []
    if "irrigation" in t or "water" in t:
        notes.append("Voice note mentions water — cross-check irrigation scheduling with rainfall outlook.")
    return notes
