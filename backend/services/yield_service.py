"""Yield prediction via trained sklearn Pipeline (or legacy label-encoded matrix)."""

from __future__ import annotations

import logging

import numpy as np
from sklearn.pipeline import Pipeline

from ml_models.loader import load_yield_bundle
from services.ml_features import yield_inference_frame

logger = logging.getLogger(__name__)


def _legacy_predict(
    model,
    enc: dict,
    state: str,
    crop: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
) -> float:
    le_s, le_c, le_z = enc["state"], enc["crop"], enc["season"]

    def _t(le, v, default=0):
        classes = list(le.classes_)
        key = str(v).strip()
        if key in classes:
            return float(le.transform([key])[0])
        low = key.lower()
        m = next((c for c in classes if str(c).lower() == low), None)
        if m is not None:
            return float(le.transform([m])[0])
        return float(default)

    xs = _t(le_s, state)
    xc = _t(le_c, crop.lower())
    xz = _t(le_z, season.lower())
    X = np.array([[xs, xc, xz, rainfall, temperature, area]], dtype=float)
    return float(model.predict(X)[0])


def predict_yield_t(
    state: str,
    crop: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
) -> float:
    model, enc = load_yield_bundle()

    if isinstance(model, Pipeline):
        row = yield_inference_frame(state, crop, season, rainfall, temperature, area)
        pred = float(model.predict(row)[0])
        logger.debug(
            "yield ML predict: state=%s crop=%s season=%s -> %.4f t/ha",
            state,
            crop,
            season,
            pred,
        )
        return max(0.3, min(15.0, pred))

    # Legacy 6-column label-encoded models
    pred = _legacy_predict(
        model, enc, state, crop, season, rainfall, temperature, area
    )
    return max(0.3, min(15.0, pred))
