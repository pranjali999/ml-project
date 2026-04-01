"""Human-readable 'Best Decision Summary' for /predict responses."""

from __future__ import annotations


def _title_crop(name: str) -> str:
    s = str(name).strip()
    if not s:
        return "this crop"
    return s[0].upper() + s[1:] if len(s) > 1 else s.upper()


def _profit_sentence(crop: str, profit: float) -> str:
    label = _title_crop(crop)
    if float(profit) > 0:
        return f"✅ {label} is the most profitable option under current conditions."
    return f"⚠️ {label} may result in a loss under current conditions."


def _risk_sentence(risk_level: str, rainfall: float | None) -> str:
    L = str(risk_level).upper().strip()
    if L == "LOW":
        return "Risk is low, indicating stable growing conditions."
    if L == "HIGH":
        return "⚠️ Risk is high due to unfavorable conditions."
    # MEDIUM
    if rainfall is not None and 600 <= float(rainfall) < 1200:
        return "⚠️ Risk is medium due to moderate rainfall."
    return "⚠️ Risk is medium due to moderate environmental conditions."


def _yield_sentence(yield_t: float) -> str:
    return f"📊 Expected yield is {float(yield_t):.2f} tonnes per hectare."


def _confidence_sentence(confidence: float | None) -> str | None:
    if confidence is None:
        return None
    c = float(confidence)
    if c >= 0.75:
        return "This recommendation has high confidence."
    if c >= 0.45:
        return "This recommendation has moderate confidence — cross-check with local factors."
    return "Treat this outlook with caution — model confidence is lower for this scenario."


def build_decision_summary(
    recommended_crop: str,
    profit: float,
    risk: str,
    yield_t: float,
    rainfall: float | None = None,
    confidence: float | None = None,
) -> str:
    """
    Compose a short, assistant-style summary for the farmer.
    Paragraphs are newline-separated for display with white-space: pre-line.
    """
    lines = [
        _profit_sentence(recommended_crop, profit),
        _risk_sentence(risk, rainfall),
        _yield_sentence(yield_t),
    ]
    conf = _confidence_sentence(confidence)
    if conf:
        lines.append(conf)
    return "\n".join(lines)
