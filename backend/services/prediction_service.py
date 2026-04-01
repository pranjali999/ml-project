"""Orchestrates full prediction payload for /predict — ML yield + crop + profit + risk + suggestions + confidence + multi-crop + SHAP."""

from __future__ import annotations

import logging
import time
from typing import Any

from sklearn.pipeline import Pipeline

from ml_models.loader import load_yield_bundle
from services.confidence_service import (
    combined_prediction_confidence,
    pipeline_yield_confidence,
)
from services.crop_service import recommend_crop
from services.decision_summary_service import build_decision_summary
from services.explanation_text_service import top_factor_to_explanation_text
from services.ml_features import yield_inference_frame
from services.model_label_service import yield_model_display_name
from services.multi_crop_service import top_crops_by_profit
from services.profit_service import estimate_profit_inr
from services.risk_service import composite_risk
from services.shap_insight_service import build_prediction_insights
from services.suggestion_service import build_suggestions, enrich_from_voice_text
from services.waste_service import build_sustainability_payload
from services.yield_service import predict_yield_t
from utils.state_normalize import canonicalize_state

logger = logging.getLogger(__name__)

_LOSS_SUGGESTION = "⚠️ Estimated loss — consider alternative crops"


def run_full_prediction(payload: dict[str, Any]) -> dict[str, Any]:
    t0 = time.perf_counter()

    state = canonicalize_state(payload["state"])
    crop = str(payload["crop"])
    season = str(payload["season"])
    rainfall = float(payload["rainfall"])
    temperature = float(payload["temperature"])
    area = float(payload["area"])
    soil = payload.get("soil")
    region = canonicalize_state(payload.get("region") or payload["state"])
    voice = payload.get("voice_text")
    include_shap_plot = bool(payload.get("include_shap_plot", False))

    y = predict_yield_t(state, crop, season, rainfall, temperature, area)
    rec = recommend_crop(rainfall, temperature, soil, region, season)
    profit_info = estimate_profit_inr(rec["recommended_crop"], y, area)
    profit_inr = float(profit_info["profit_inr"])
    profitability: str = "loss" if profit_inr < 0 else "profit"

    risk = composite_risk(rainfall, temperature)
    suggestions = build_suggestions(rainfall, temperature, y, crop)
    suggestions.extend(enrich_from_voice_text(voice))
    if profitability == "loss" and _LOSS_SUGGESTION not in suggestions:
        suggestions.insert(0, _LOSS_SUGGESTION)

    pipe_or_model, _enc = load_yield_bundle()
    model_used = yield_model_display_name(pipe_or_model)
    if isinstance(pipe_or_model, Pipeline):
        prep = pipe_or_model.named_steps["prep"]
        X_df = yield_inference_frame(state, crop, season, rainfall, temperature, area)
        X_t = prep.transform(X_df)
        y_conf = pipeline_yield_confidence(pipe_or_model, X_t)
    else:
        y_conf = 0.72

    confidence = combined_prediction_confidence(y_conf, rec.get("confidence"))
    top_crops = top_crops_by_profit(
        state, season, rainfall, temperature, area, top_n=3
    )
    insights = build_prediction_insights(
        state,
        crop,
        season,
        rainfall,
        temperature,
        area,
        include_plot=include_shap_plot,
    )

    top_factor = insights.get("top_factor")
    explanation_text = top_factor_to_explanation_text(top_factor)

    decision_summary = build_decision_summary(
        recommended_crop=str(rec["recommended_crop"]),
        profit=profit_inr,
        risk=str(risk["risk"]),
        yield_t=float(y),
        rainfall=rainfall,
        confidence=confidence,
    )

    sustainability = build_sustainability_payload(
        yield_t_per_ha=float(y),
        crop=crop,
        state=state,
        area_ha=area,
    )

    elapsed_ms = int((time.perf_counter() - t0) * 1000)

    logger.info(
        "prediction: yield=%.3f t/ha profit=%s INR (%s) rec_crop=%s risk=%s conf=%.2f top_factor=%s %dms",
        y,
        profit_inr,
        profitability,
        rec.get("recommended_crop"),
        risk.get("risk"),
        confidence,
        top_factor,
        elapsed_ms,
    )

    return {
        "yield": round(y, 3),
        "yield_unit": "tonnes_per_hectare",
        "profit": profit_info["profit_inr"],
        "profit_detail": profit_info,
        "profitability": profitability,
        "recommended_crop": rec["recommended_crop"],
        "crop_alternatives": rec.get("alternatives", []),
        "risk": risk["risk"],
        "risk_score": risk["risk_score"],
        "risk_explanation": risk["explanation"],
        "suggestions": suggestions,
        "confidence": confidence,
        "yield_confidence": round(y_conf, 3),
        "crop_confidence": round(float(rec.get("confidence") or 0.0), 3),
        "top_crops": top_crops,
        "feature_importance": insights.get("feature_importance") or {},
        "top_factor": top_factor,
        "explanation_text": explanation_text,
        "model_used": model_used,
        "response_time_ms": elapsed_ms,
        "shap_plot_base64": insights.get("shap_plot_base64"),
        "decision_summary": decision_summary,
        **sustainability,
    }
