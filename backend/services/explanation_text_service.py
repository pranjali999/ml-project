"""Convert SHAP `top_factor` keys into a single readable sentence."""

from __future__ import annotations

_PRETTY: dict[str, str] = {
    "rainfall": "Rainfall",
    "temperature": "Temperature",
    "area": "Cultivated area",
    "crop": "Crop choice",
    "season": "Season",
    "state": "State / region",
    "rainfall category": "Rainfall category",
    "rainfall_category": "Rainfall category",
}


def top_factor_to_explanation_text(top_factor: str | None) -> str:
    if not top_factor:
        return "Several environmental and agronomic factors influenced this yield estimate."
    raw = str(top_factor).replace("_", " ").strip()
    key = raw.lower()
    label = _PRETTY.get(key, raw.title())
    return f"{label} had the highest impact on the prediction."
