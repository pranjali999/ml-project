"""
Agro-climate rule scores for Indian crops (rainfall mm, °C, soil, state, season).

Used to blend with the RF crop classifier so recommendations track real agronomic patterns
instead of noisy synthetic training labels.
"""

from __future__ import annotations

import math
import re
from typing import Any

# Ideal bands: (hard_min, soft_min, soft_max, hard_max) — flat 1.0 inside soft band, taper outside
_CROP_BANDS: dict[str, dict[str, tuple[float, float, float, float]]] = {
    "rice": {"rain": (400, 900, 2200, 3200), "temp": (18, 22, 34, 40)},
    "wheat": {"rain": (250, 400, 950, 1400), "temp": (8, 14, 26, 32)},
    "maize": {"rain": (400, 550, 1200, 1800), "temp": (16, 20, 32, 38)},
    "cotton": {"rain": (450, 600, 1150, 1600), "temp": (20, 24, 36, 42)},
    "sugarcane": {"rain": (550, 700, 1500, 2400), "temp": (18, 22, 35, 40)},
    "soybean": {"rain": (600, 750, 1300, 1800), "temp": (20, 22, 32, 38)},
    "groundnut": {"rain": (400, 500, 1100, 1600), "temp": (20, 22, 34, 40)},
    "bajra": {"rain": (200, 350, 750, 1100), "temp": (22, 26, 38, 44)},
    "tur": {"rain": (500, 650, 1200, 1700), "temp": (20, 24, 34, 40)},
    "potato": {"rain": (300, 450, 950, 1300), "temp": (10, 14, 24, 30)},
    "onion": {"rain": (350, 500, 1000, 1400), "temp": (12, 18, 28, 34)},
    "mustard": {"rain": (250, 350, 850, 1200), "temp": (8, 12, 25, 32)},
    # Aliases for MSP / frontend naming (if ever in encoder)
    "millets": {"rain": (250, 400, 900, 1300), "temp": (20, 24, 36, 42)},
    "pulses": {"rain": (400, 550, 1100, 1600), "temp": (18, 22, 34, 38)},
}

_SOIL_NUDGE: dict[str, dict[str, float]] = {
    "alluvial": {"rice": 1.2, "wheat": 1.15, "sugarcane": 1.1, "potato": 1.05},
    "black": {"cotton": 1.25, "soybean": 1.15, "tur": 1.1, "sugarcane": 1.08},
    "red": {"groundnut": 1.2, "tur": 1.1, "cotton": 1.08, "bajra": 1.05},
    "laterite": {"groundnut": 1.1, "tur": 1.05},
    "arid": {"bajra": 1.25, "groundnut": 1.08, "maize": 1.05},
    "mountain": {"potato": 1.15, "wheat": 1.08, "maize": 1.05},
    "unknown": {},
}

_SEASON_NUDGE: dict[str, dict[str, float]] = {
    "kharif": {
        "rice": 1.42,
        "cotton": 1.28,
        "maize": 1.22,
        "tur": 1.18,
        "groundnut": 1.12,
        "sugarcane": 1.1,
        "soybean": 1.06,
    },
    "rabi": {
        "wheat": 1.45,
        "mustard": 1.3,
        "potato": 1.2,
        "onion": 1.12,
        "maize": 1.05,
    },
    "zaid": {"maize": 1.25, "rice": 1.1, "potato": 1.1, "onion": 1.08},
}

# Broad state → dominant cropping patterns (multipliers)
_STATE_CROP_WEIGHT: dict[str, dict[str, float]] = {
    "punjab,haryana,chandigarh": {"wheat": 1.5, "rice": 1.35, "maize": 1.2, "cotton": 1.05},
    "uttar pradesh": {"sugarcane": 1.35, "wheat": 1.3, "rice": 1.25, "potato": 1.1},
    "madhya pradesh,chhattisgarh": {"soybean": 1.32, "wheat": 1.22, "rice": 1.18, "maize": 1.15},
    "maharashtra": {"sugarcane": 1.3, "cotton": 1.28, "soybean": 1.15, "maize": 1.08, "onion": 1.05},
    "gujarat": {"cotton": 1.35, "groundnut": 1.3, "wheat": 1.15, "bajra": 1.1},
    "rajasthan": {"bajra": 1.35, "wheat": 1.25, "mustard": 1.2, "maize": 1.05},
    "karnataka,telangana,andhra pradesh": {"rice": 1.25, "cotton": 1.22, "groundnut": 1.15, "maize": 1.1},
    "tamil nadu,kerala": {"rice": 1.35, "cotton": 1.15, "tur": 1.12, "sugarcane": 1.1},
    "west bengal,bihar,odisha,assam": {"rice": 1.45, "maize": 1.12, "potato": 1.08},
    "himachal pradesh,uttarakhand": {"wheat": 1.22, "potato": 1.18, "maize": 1.14, "rice": 1.06},
    "jharkhand": {"rice": 1.28, "maize": 1.12, "tur": 1.1, "potato": 1.05},
    "arunachal pradesh,nagaland,manipur,mizoram,tripura,meghalaya": {
        "rice": 1.3,
        "maize": 1.1,
        "potato": 1.06,
    },
    "sikkim": {"rice": 1.12, "maize": 1.1, "potato": 1.14},
    "goa": {"rice": 1.12, "cotton": 1.05, "sugarcane": 1.08},
    "ladakh,jammu and kashmir": {"wheat": 1.18, "potato": 1.15, "maize": 1.05, "rice": 1.04},
    "puducherry": {"rice": 1.18, "cotton": 1.06, "sugarcane": 1.05},
    "andaman and nicobar island": {"rice": 1.2, "maize": 1.06, "tur": 1.04},
    "dadra and nagar haveli": {"rice": 1.08, "cotton": 1.06, "groundnut": 1.04},
    "daman and diu": {"rice": 1.05, "cotton": 1.04, "groundnut": 1.03},
    "lakshadweep": {"rice": 1.15},
}


def _build_state_group_index() -> dict[str, str]:
    idx: dict[str, str] = {}
    for group in _STATE_CROP_WEIGHT:
        for token in group.split(","):
            t = token.strip().lower()
            if t:
                idx[t] = group
    return idx


_STATE_GROUP_INDEX: dict[str, str] = _build_state_group_index()


def _norm_state(s: str) -> str:
    t = re.sub(r"\s+", " ", str(s).strip().lower())
    return t


def _state_group(state: str) -> str | None:
    n = _norm_state(state)
    if not n or n == "unknown":
        return None
    if n in _STATE_GROUP_INDEX:
        return _STATE_GROUP_INDEX[n]
    # Typo / extra wording: prefer longest state token that appears inside `n`
    best_len = 0
    best_grp: str | None = None
    for tok, grp in _STATE_GROUP_INDEX.items():
        if len(tok) < 5:
            continue
        if tok in n and len(tok) > best_len:
            best_len = len(tok)
            best_grp = grp
    return best_grp


def _band_score(x: float, hard_lo: float, soft_lo: float, soft_hi: float, hard_hi: float) -> float:
    if x < hard_lo or x > hard_hi:
        return 0.12
    if soft_lo <= x <= soft_hi:
        return 1.0
    if x < soft_lo:
        t = (x - hard_lo) / max(soft_lo - hard_lo, 1e-6)
        return 0.35 + 0.65 * max(0.0, min(1.0, t))
    t = (hard_hi - x) / max(hard_hi - soft_hi, 1e-6)
    return 0.35 + 0.65 * max(0.0, min(1.0, t))


def _crop_env_score(crop: str, rainfall: float, temperature: float) -> float:
    key = crop.lower().strip()
    bands = _CROP_BANDS.get(key)
    if not bands:
        return 0.35
    rb = bands["rain"]
    tb = bands["temp"]
    r_s = _band_score(rainfall, rb[0], rb[1], rb[2], rb[3])
    t_s = _band_score(temperature, tb[0], tb[1], tb[2], tb[3])
    return max(0.08, math.sqrt(r_s * t_s))


def score_crops(
    rainfall: float,
    temperature: float,
    soil: str | None,
    region: str,
    season: str | None,
    crop_classes: list[str] | Any,
) -> dict[str, float]:
    """Return non-negative scores per crop label (lowercase keys matching classifier)."""
    soil_k = (soil or "unknown").strip().lower()
    if soil_k not in _SOIL_NUDGE:
        soil_k = "unknown"

    sn: str | None = None
    if season:
        s = str(season).strip().lower()
        if s in _SEASON_NUDGE:
            sn = s
    if sn is None:
        if rainfall >= 950 or (rainfall >= 780 and temperature >= 26):
            sn = "kharif"
        elif rainfall <= 750 and temperature <= 32:
            sn = "rabi"

    grp = _state_group(region)
    state_weights = _STATE_CROP_WEIGHT.get(grp, {}) if grp else {}

    out: dict[str, float] = {}
    for c in crop_classes:
        cl = str(c).lower().strip()
        base = _crop_env_score(cl, rainfall, temperature)
        mult = 1.0
        for crop_key, w in _SOIL_NUDGE.get(soil_k, {}).items():
            if crop_key == cl:
                mult *= w
        if sn:
            mult *= _SEASON_NUDGE.get(sn, {}).get(cl, 1.0)
        mult *= state_weights.get(cl, 1.0)
        # Slight diversity: avoid one crop dominating everywhere without env fit
        out[cl] = max(1e-6, base * mult)

    _soybean_only_central_kharif(out, grp, sn)
    _apply_state_season_tweaks(out, grp, sn)
    return out


def _soybean_only_central_kharif(
    out: dict[str, float],
    state_group: str | None,
    season: str | None,
) -> None:
    """Soybean is a strong fit mainly for MP/MH/CG in Kharif — damp elsewhere."""
    if "soybean" not in out:
        return
    core = state_group in ("madhya pradesh,chhattisgarh", "maharashtra")
    if core and season == "kharif":
        return
    out["soybean"] *= 0.42


def _apply_state_season_tweaks(
    out: dict[str, float],
    state_group: str | None,
    season: str | None,
) -> None:
    """Cross-state × season corrections (e.g. Punjab Kharif is rice/maize, not wheat)."""
    if not season or not state_group:
        return
    if state_group == "punjab,haryana,chandigarh":
        if season == "kharif":
            for k in list(out.keys()):
                if k == "wheat":
                    out[k] *= 0.55
                elif k == "mustard":
                    out[k] *= 0.5
                elif k in ("rice", "maize", "cotton"):
                    out[k] *= 1.28
                elif k == "soybean":
                    out[k] *= 0.85
        elif season == "rabi":
            for k in list(out.keys()):
                if k == "wheat":
                    out[k] *= 1.35
                elif k == "mustard":
                    out[k] *= 1.2
                elif k == "rice":
                    out[k] *= 0.75
    if state_group == "west bengal,bihar,odisha,assam" and season == "rabi":
        for k in list(out.keys()):
            if k == "rice":
                out[k] *= 0.85
            elif k in ("wheat", "potato", "maize"):
                out[k] *= 1.12


def normalize_scores(scores: dict[str, float]) -> dict[str, float]:
    s = sum(scores.values())
    if s <= 0:
        return {k: 1.0 / len(scores) for k in scores}
    return {k: v / s for k, v in scores.items()}
