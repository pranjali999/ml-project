"""SHAP feature importance for yield model."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
from sklearn.pipeline import Pipeline

from ml_models.loader import load_yield_bundle
from services.ml_features import yield_inference_frame
from services.explanation_text_service import top_factor_to_explanation_text
from services.shap_insight_service import shap_ranking_to_feature_importance
from services.yield_service import predict_yield_t

logger = logging.getLogger(__name__)


def explain_prediction(
    state: str,
    crop: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
) -> dict[str, Any]:
    model, enc = load_yield_bundle()
    pred = predict_yield_t(state, crop, season, rainfall, temperature, area)

    if isinstance(model, Pipeline):
        prep = model.named_steps['prep']
        reg = model.named_steps['model']
        X_df = yield_inference_frame(
            state, crop, season, rainfall, temperature, area
        )
        X_t = prep.transform(X_df)
        try:
            names = list(prep.get_feature_names_out())
        except Exception:
            names = [f"f{i}" for i in range(X_t.shape[1])]

        try:
            import shap
            from sklearn.linear_model import LinearRegression

            if isinstance(reg, LinearRegression):
                rng = np.random.default_rng(42)
                bg = X_t + rng.normal(
                    0, np.maximum(np.abs(X_t), 1e-6) * 0.08, size=(100, X_t.shape[1])
                )
                explainer = shap.LinearExplainer(reg, bg)
            else:
                explainer = shap.TreeExplainer(reg)
            sv = explainer.shap_values(X_t)
            if isinstance(sv, list):
                sv = sv[0]
            sv = np.asarray(sv)
            if sv.ndim > 1:
                sv = sv[0]
            sv = sv.flatten()
            imp = np.abs(sv)
            order = np.argsort(imp)[::-1]
            ranked = [
                {"feature": names[i] if i < len(names) else f"f{i}", "shap_value": float(sv[i])}
                for i in order
            ]
            ev = np.asarray(explainer.expected_value).ravel()
            base_value = float(ev[0]) if ev.size else 0.0
        except Exception as e:
            logger.warning("SHAP failed, using heuristic: %s", e)
            ranked = [
                {"feature": "rainfall", "shap_value": 0.4},
                {"feature": "temperature", "shap_value": 0.25},
                {"feature": "area", "shap_value": 0.15},
            ]
            base_value = 0.0

        top = ranked[0]["feature"] if ranked else "rainfall"
        fi = shap_ranking_to_feature_importance(ranked[:16])
        top_factor = max(fi, key=fi.get) if fi else "rainfall"
        explanation_text = top_factor_to_explanation_text(str(top_factor))
        narrative = (
            explanation_text
            if fi
            else (
                "Rainfall contributed most to this prediction"
                if "rain" in str(top).lower()
                else f"{top} had the largest marginal effect on the yield estimate."
            )
        )

        return {
            "expected_value": base_value,
            "prediction": pred,
            "shap_ranking": ranked[:8],
            "feature_importance": fi,
            "top_factor": top_factor,
            "explanation_text": explanation_text,
            "summary": narrative,
        }

    # Legacy 6-feature model
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

    row = np.array(
        [
            [
                _t(le_s, state),
                _t(le_c, crop.lower()),
                _t(le_z, season.lower()),
                rainfall,
                temperature,
                area,
            ]
        ],
        dtype=float,
    )
    FEATURE_NAMES = [
        "state_enc",
        "crop_enc",
        "season_enc",
        "rainfall",
        "temperature",
        "area",
    ]

    try:
        import shap

        explainer = shap.TreeExplainer(model)
        sv = explainer.shap_values(row)
        if isinstance(sv, list):
            sv = sv[0]
        sv = np.asarray(sv)
        if sv.ndim > 1:
            sv = sv[0]
        sv = sv.flatten()
        imp = np.abs(sv)
        order = np.argsort(imp)[::-1]
        ranked = [
            {"feature": FEATURE_NAMES[i], "shap_value": float(sv[i])}
            for i in order
        ]
        ev = np.asarray(explainer.expected_value).ravel()
        base_value = float(ev[0]) if ev.size else 0.0
    except Exception as e:
        logger.warning("SHAP failed, using heuristic: %s", e)
        ranked = [
            {"feature": "rainfall", "shap_value": 0.4},
            {"feature": "temperature", "shap_value": 0.25},
            {"feature": "area", "shap_value": 0.15},
        ]
        base_value = 0.0

    top = ranked[0]["feature"] if ranked else "rainfall"
    fi = shap_ranking_to_feature_importance(ranked[:16])
    top_factor = max(fi, key=fi.get) if fi else "rainfall"
    explanation_text = top_factor_to_explanation_text(str(top_factor))
    narrative = (
        explanation_text
        if fi
        else (
            "Rainfall contributed most to this prediction"
            if top in ("rainfall", "rainfall_mm")
            else f"{top} had the largest marginal effect on the yield estimate."
        )
    )

    return {
        "expected_value": base_value,
        "prediction": pred,
        "shap_ranking": ranked[:8],
        "feature_importance": fi,
        "top_factor": top_factor,
        "explanation_text": explanation_text,
        "summary": narrative,
    }
