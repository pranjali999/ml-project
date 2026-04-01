"""REST API routes."""

from __future__ import annotations

import logging
import time
from typing import Any

from flask import Blueprint, jsonify, request
from pydantic import ValidationError as PydanticValidationError

from database import repositories as repo
from models.schemas import (
    ChatbotRequest,
    ExplainRequest,
    ForecastRequest,
    HistoryAction,
    PredictRequest,
    ProfitRequest,
    RAGRequest,
    RecommendRequest,
    RiskRequest,
)
from services.chatbot_service import respond as chat_respond
from services.crop_service import recommend_crop
from services.explain_service import explain_prediction
from services.forecast_service import forecast_yield_trend
from services.prediction_service import run_full_prediction
from services.profit_service import estimate_profit_inr
from services.rag_service import query_rag
from services.risk_service import rainfall_risk_band
from services.weather_service import fetch_weather_by_city

logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__)


def _json_error(error: str, code: int = 400, **extra: Any):
    """Return JSON error. First arg → body[\"error\"]. Use detail=… (not message=) for exception text."""
    body: dict[str, Any] = {"ok": False, "error": error}
    body.update(extra)
    return jsonify(body), code


@api_bp.route("/health", methods=["GET"])
def health():
    return jsonify({"ok": True, "service": "agrimind-api", "version": "1.0.0"})


@api_bp.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True, silent=False) or {}
        req = PredictRequest.model_validate(data)
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())

    try:
        payload = req.model_dump()
        out = run_full_prediction(payload)
        logger.debug(
            "POST /predict ok yield=%s profit=%s crop=%s risk=%s",
            out.get("yield"),
            out.get("profit"),
            out.get("recommended_crop"),
            out.get("risk"),
        )
        response = {
            "ok": True,
            "yield": out["yield"],
            "profit": out["profit"],
            "profitability": out["profitability"],
            "recommended_crop": out["recommended_crop"],
            "risk": out["risk"],
            "suggestions": out["suggestions"],
            "confidence": out["confidence"],
            "top_crops": out["top_crops"],
            "feature_importance": out["feature_importance"],
            "top_factor": out["top_factor"],
            "explanation_text": out["explanation_text"],
            "model_used": out["model_used"],
            "response_time_ms": out["response_time_ms"],
            "decision_summary": out["decision_summary"],
            "residue_per_hectare": out["residue_per_hectare"],
            "residue_generated": out["residue_generated"],
            "co2_per_hectare": out["co2_per_hectare"],
            "co2_emission": out["co2_emission"],
            "pm25_per_hectare": out["pm25_per_hectare"],
            "pm25_emission": out["pm25_emission"],
            "impact_message": out["impact_message"],
            "emission_reduction_percent": out["emission_reduction_percent"],
            "co2_saved": out["co2_saved"],
            "waste_solutions": out["waste_solutions"],
            "sustainability_source": out["sustainability_source"],
            "data_source": {
                "weather": (payload.get("weather_source") or "Client").strip(),
                "soil": (payload.get("soil_source") or "Client").strip(),
                "season": "System Derived",
            },
            "data_timestamp": int(time.time() * 1000),
            "detail": {
                "yield_unit": out["yield_unit"],
                "profit_detail": out["profit_detail"],
                "risk_score": out["risk_score"],
                "risk_explanation": out["risk_explanation"],
                "crop_alternatives": out["crop_alternatives"],
                "yield_confidence": out.get("yield_confidence"),
                "crop_confidence": out.get("crop_confidence"),
                "shap_plot_base64": out.get("shap_plot_base64"),
            },
        }
        uid = payload.get("user_id")
        if uid:
            repo.ensure_user(str(uid))
            repo.save_prediction(
                str(uid),
                payload,
                {
                    "yield": response["yield"],
                    "profit": response["profit"],
                    "recommended_crop": response["recommended_crop"],
                    "risk": response["risk"],
                    "suggestions": response["suggestions"],
                    "detail": response["detail"],
                },
            )
        return jsonify(response)
    except FileNotFoundError as e:
        return _json_error(str(e), 503)
    except Exception as e:
        logger.exception("predict failed")
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/recommend", methods=["POST"])
def recommend():
    try:
        req = RecommendRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    try:
        out = recommend_crop(
            req.rainfall, req.temperature, req.soil, req.region, req.season
        )
        logger.debug(
            "POST /recommend ok crop=%s conf=%.3f",
            out.get("recommended_crop"),
            float(out.get("confidence") or 0.0),
        )
        return jsonify({"ok": True, **out})
    except FileNotFoundError as e:
        return _json_error(str(e), 503)
    except Exception as e:
        logger.exception("recommend failed")
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/profit", methods=["POST"])
def profit():
    try:
        req = ProfitRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    try:
        out = estimate_profit_inr(req.crop, req.yield_per_ha, req.area)
        return jsonify({"ok": True, **out})
    except Exception as e:
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/forecast", methods=["POST"])
def forecast():
    try:
        req = ForecastRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    try:
        out = forecast_yield_trend(req.periods, req.history)
        return jsonify({"ok": True, **out})
    except Exception as e:
        logger.exception("forecast failed")
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/explain", methods=["POST"])
def explain():
    try:
        req = ExplainRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    try:
        out = explain_prediction(
            req.state,
            req.crop,
            req.season,
            req.rainfall,
            req.temperature,
            req.area,
        )
        return jsonify({"ok": True, **out})
    except FileNotFoundError as e:
        return _json_error(str(e), 503)
    except Exception as e:
        logger.exception("explain failed")
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/risk", methods=["POST"])
def risk():
    try:
        req = RiskRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    level, explanation = rainfall_risk_band(req.rainfall)
    return jsonify(
        {
            "ok": True,
            "risk": level,
            "rainfall_mm": req.rainfall,
            "explanation": explanation,
        }
    )


@api_bp.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        req = ChatbotRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    out = chat_respond(req.query, req.context)
    return jsonify({"ok": True, **out})


@api_bp.route("/rag", methods=["POST"])
def rag():
    try:
        req = RAGRequest.model_validate(request.get_json(force=True) or {})
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())
    try:
        out = query_rag(req.query)
        return jsonify({"ok": True, **out})
    except Exception as e:
        logger.exception("rag failed")
        return _json_error("internal_error", 500, detail=str(e))


@api_bp.route("/history", methods=["POST"])
def history():
    try:
        body = request.get_json(force=True) or {}
        req = HistoryAction.model_validate(body)
    except PydanticValidationError as e:
        return _json_error("validation_failed", 422, details=e.errors())

    if req.action == "save":
        if not req.input or not req.prediction:
            return _json_error("input and prediction required for save", 400)
        repo.ensure_user(req.user_id)
        r = repo.save_prediction(req.user_id, req.input, req.prediction, req.meta)
        if not r.get("ok"):
            return _json_error(r.get("reason", "save_failed"), 503)
        return jsonify({"ok": True, "prediction_id": r.get("prediction_id")})

    # list
    rows = repo.list_history(req.user_id, req.limit)
    return jsonify({"ok": True, "items": rows, "count": len(rows)})


@api_bp.route("/weather/current", methods=["GET"])
def weather_current():
    city = request.args.get("city", "").strip()
    if not city:
        return _json_error("query param city is required", 400)
    out = fetch_weather_by_city(city)
    status = 200 if out.get("ok") else 503
    return jsonify(out), status
