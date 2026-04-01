"""
SHAP-based feature importance summary for /predict (compact JSON + optional PNG base64).
Reuses the same transforms as explain_service.
"""

from __future__ import annotations

import base64
import io
import logging
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.pipeline import Pipeline

from ml_models.loader import load_yield_bundle
from services.ml_features import yield_inference_frame

logger = logging.getLogger(__name__)


def _humanize_feature(name: str) -> str:
    s = str(name).lower()
    if "rain_cat" in s or "rainfall_category" in s:
        return "rainfall_category"
    if "__" in s:
        s = s.split("__", 1)[-1]
    s = s.replace("x0_", "").replace("_", " ").strip()
    if "rainfall" in s and "category" not in s:
        return "rainfall"
    if "temperature" in s:
        return "temperature"
    if "area" in s:
        return "area"
    if "season" in s:
        return "season"
    if "crop" in s:
        return "crop"
    if "state" in s:
        return "state"
    return s[:32] if s else "feature"


def shap_ranking_to_feature_importance(ranked: list[dict[str, Any]]) -> dict[str, float]:
    """Normalize absolute SHAP values into a small dict (aggregated by humanized name)."""
    agg: dict[str, float] = {}
    for r in ranked:
        h = _humanize_feature(r.get("feature", ""))
        agg[h] = agg.get(h, 0.0) + abs(float(r.get("shap_value", 0.0)))
    total = sum(agg.values()) or 1.0
    out = {k: round(v / total, 4) for k, v in sorted(agg.items(), key=lambda x: -x[1])[:12]}
    # keep top 6 for response size
    top_keys = list(out.keys())[:6]
    return {k: out[k] for k in top_keys}


def _shap_values_pipeline(
    pipe: Pipeline, X_df, prep, reg
) -> tuple[np.ndarray | None, list[str]]:
    X_t = prep.transform(X_df)
    try:
        names = list(prep.get_feature_names_out())
    except Exception:
        names = [f"f{i}" for i in range(X_t.shape[1])]

    try:
        import shap

        if isinstance(reg, LinearRegression):
            rng = np.random.default_rng(42)
            bg = X_t + rng.normal(
                0, np.maximum(np.abs(X_t), 1e-6) * 0.08, size=(80, X_t.shape[1])
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
        return sv.flatten(), names
    except Exception as e:
        logger.warning("SHAP insight failed: %s", e)
        return None, names


def build_prediction_insights(
    state: str,
    crop: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
    include_plot: bool = False,
) -> dict[str, Any]:
    """
    Returns feature_importance, top_factor, optional shap_plot_base64, shap_ranking (internal).
    """
    model, enc = load_yield_bundle()
    X_df = yield_inference_frame(state, crop, season, rainfall, temperature, area)

    if not isinstance(model, Pipeline):
        return {
            "feature_importance": {
                "rainfall": 0.35,
                "temperature": 0.25,
                "area": 0.2,
                "state": 0.1,
                "crop": 0.1,
            },
            "top_factor": "rainfall",
            "shap_plot_base64": None,
        }

    prep = model.named_steps["prep"]
    reg = model.named_steps["model"]
    sv, names = _shap_values_pipeline(model, X_df, prep, reg)
    if sv is None:
        return {
            "feature_importance": {
                "rainfall": 0.35,
                "temperature": 0.25,
                "area": 0.2,
            },
            "top_factor": "rainfall",
            "shap_plot_base64": None,
        }

    ranked = [
        {"feature": names[i] if i < len(names) else f"f{i}", "shap_value": float(sv[i])}
        for i in np.argsort(np.abs(sv))[::-1][:16]
    ]
    fi = shap_ranking_to_feature_importance(ranked)
    top_factor = max(fi, key=fi.get) if fi else "rainfall"

    plot_b64: str | None = None
    if include_plot:
        try:
            fig, ax = plt.subplots(figsize=(8, 4))
            keys = list(fi.keys())[:8]
            vals = [fi[k] for k in keys]
            ax.barh(keys[::-1], vals[::-1], color="#0d9488")
            ax.set_xlabel("Normalized |SHAP| contribution")
            ax.set_title("Feature importance (approx.)")
            fig.tight_layout()
            buf = io.BytesIO()
            fig.savefig(buf, format="png", dpi=120, bbox_inches="tight")
            plt.close(fig)
            plot_b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        except Exception as e:
            logger.warning("SHAP plot encode failed: %s", e)

    return {
        "feature_importance": fi,
        "top_factor": top_factor,
        "shap_plot_base64": plot_b64,
    }
