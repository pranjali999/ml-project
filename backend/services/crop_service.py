"""Crop recommendation from agro-climate rules (state, season, rain, temp, soil)."""

from __future__ import annotations

import logging

import numpy as np

from ml_models.loader import load_crop_bundle
from services.crop_rules_engine import score_crops
from utils.constants import STATES
from utils.state_normalize import canonicalize_state

logger = logging.getLogger(__name__)


def _pretty_crop(name: str) -> str:
    s = str(name).strip()
    if not s:
        return s
    return s[:1].upper() + s[1:].lower()


def _safe_state_encode(le, state: str) -> int:
    """Match user state to encoder classes (model uses lowercase names)."""
    key = str(state).strip().lower()
    key = " ".join(key.split())
    classes = list(le.classes_)
    lowered = {str(c).lower(): c for c in classes}

    if key in lowered:
        return int(le.transform([lowered[key]])[0])

    for canon, raw in lowered.items():
        if canon in key or key in canon:
            return int(le.transform([raw])[0])

    for s in STATES:
        sl = str(s).strip().lower()
        if sl in lowered:
            return int(le.transform([lowered[sl]])[0])

    return int(le.transform([classes[0]])[0])


def recommend_crop(
    rainfall: float,
    temperature: float,
    soil: str | None,
    region: str,
    season: str | None = None,
) -> dict:
    """
    Primary crop from agro-climate rules (realistic). RF probabilities are not used for the
    top pick — the trained classifier often collapses to one label (e.g. soybean) on synthetic data.
    """
    region = canonicalize_state(region)
    _, bundle = load_crop_bundle()

    if isinstance(bundle, dict) and "classifier" in bundle:
        le_crop = bundle["crop_encoder"]
        classes = le_crop.classes_
        raw_rules = score_crops(rainfall, temperature, soil, region, season, classes)
        scores_vec = np.array(
            [float(raw_rules.get(str(c).lower().strip(), 0.0)) for c in classes],
            dtype=float,
        )
        tot = float(scores_vec.sum())
        if tot <= 0:
            scores_vec = np.ones(len(classes), dtype=float)
            tot = float(scores_vec.sum())
        order = np.argsort(scores_vec)[::-1]
        best_i = int(order[0])
        label = classes[best_i]
        alternatives = [str(classes[int(i)]) for i in order[1:4]]
        top = float(scores_vec[best_i])
        confidence = float(min(0.9, max(0.28, 0.25 + 0.65 * (top / tot))))
        logger.debug(
            "crop recommend (rules): region=%s season=%s rain=%.1f temp=%.1f -> %s (conf=%.3f)",
            region,
            season,
            rainfall,
            temperature,
            label,
            confidence,
        )
        return {
            "recommended_crop": _pretty_crop(str(label)),
            "alternatives": [_pretty_crop(str(a)) for a in alternatives],
            "confidence": confidence,
        }

    # Legacy: enc dict + crop label encoder only (recommendation from rules)
    le_crop = bundle["crop"]
    classes = le_crop.classes_
    raw_rules = score_crops(rainfall, temperature, soil, region, season, classes)
    scores_vec = np.array(
        [float(raw_rules.get(str(c).lower().strip(), 0.0)) for c in classes],
        dtype=float,
    )
    tot = float(scores_vec.sum())
    if tot <= 0:
        scores_vec = np.ones(len(classes), dtype=float)
        tot = float(scores_vec.sum())
    order = np.argsort(scores_vec)[::-1]
    best_i = int(order[0])
    label = classes[best_i]
    alternatives = [str(classes[int(i)]) for i in order[1:4]]
    top = float(scores_vec[best_i])
    confidence = float(min(0.9, max(0.28, 0.25 + 0.65 * (top / tot))))
    return {
        "recommended_crop": _pretty_crop(str(label)),
        "alternatives": [_pretty_crop(str(a)) for a in alternatives],
        "confidence": confidence,
    }
