"""Yield prediction confidence (regression) + optional blend with crop classifier confidence."""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.ensemble import (
    ExtraTreesRegressor,
    GradientBoostingRegressor,
    RandomForestRegressor,
)
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor

try:
    from xgboost import XGBRegressor
except Exception:
    XGBRegressor = None  # type: ignore


def _tree_ensemble_dispersion(reg: Any, X_t: np.ndarray) -> float:
    """Std of per-tree predictions at x (lower dispersion → higher confidence)."""
    estimators = getattr(reg, "estimators_", None)
    if estimators is None:
        return 0.25
    preds = []
    for t in estimators[: min(64, len(estimators))]:
        try:
            preds.append(float(t.predict(X_t)[0]))
        except Exception:
            continue
    if len(preds) < 2:
        return 0.2
    return float(np.std(preds))


def yield_regression_confidence(reg: Any, X_t: np.ndarray) -> float:
    """
    Map model uncertainty heuristic to [0.35, 0.97].
    RandomForest / ExtraTrees: use variance across trees.
    Others: model-specific prior.
    """
    if isinstance(reg, (RandomForestRegressor, ExtraTreesRegressor)):
        disp = _tree_ensemble_dispersion(reg, X_t)
        conf = 1.0 / (1.0 + 4.0 * disp)
        return float(np.clip(conf, 0.45, 0.97))

    if isinstance(reg, GradientBoostingRegressor):
        preds = []
        n = min(40, reg.n_estimators)
        for i in range(n):
            try:
                tree = reg.estimators_[i, 0]
                preds.append(float(tree.predict(X_t)[0]))
            except Exception:
                continue
        disp = float(np.std(preds)) if len(preds) > 1 else 0.2
        conf = 1.0 / (1.0 + 5.0 * max(disp, 0.02))
        return float(np.clip(conf, 0.42, 0.94))

    if isinstance(reg, LinearRegression):
        return 0.82

    if isinstance(reg, DecisionTreeRegressor):
        return 0.66

    if XGBRegressor is not None and isinstance(reg, XGBRegressor):
        # Leaf variance proxy: shallow boost to confidence if typical range
        return 0.78

    return 0.72


def pipeline_yield_confidence(pipe: Pipeline, X_t: np.ndarray) -> float:
    reg = pipe.named_steps.get("model")
    if reg is None:
        return 0.7
    return yield_regression_confidence(reg, X_t)


def combined_prediction_confidence(yield_conf: float, crop_conf: float | None) -> float:
    """Blend yield uncertainty with crop softmax confidence."""
    cc = float(crop_conf) if crop_conf is not None else 0.65
    cc = max(0.15, min(0.99, cc))
    yc = max(0.15, min(0.99, float(yield_conf)))
    out = 0.58 * yc + 0.42 * cc
    return round(float(np.clip(out, 0.2, 0.99)), 2)
