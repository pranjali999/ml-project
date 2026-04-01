"""Load joblib ML artifacts with fallbacks — matches training exports in ml_models/artifacts/."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import joblib
from sklearn.pipeline import Pipeline

from config import get_config

logger = logging.getLogger(__name__)

_yield_model: Any = None
_yield_meta: dict[str, Any] = {}
_crop_model: Any = None
_crop_bundle: dict[str, Any] | None = None
_prophet_model: Any = None
# True after a failed load so we do not retry joblib.load on every /forecast call.
_prophet_skip_load: bool = False


def artifacts_dir() -> Path:
    return get_config().ML_ARTIFACTS_DIR


def _load_yield_pipeline() -> Pipeline | Any:
    """
    Prefer full Pipeline (yield_xgb.joblib).
    Else assemble encoders.pkl (preprocessor) + yield_model.pkl (regressor).
    Legacy: raw estimator + label encoders in yield_encoders.joblib.
    """
    art = artifacts_dir()
    primary = art / "yield_xgb.joblib"
    if primary.is_file():
        obj: Any = joblib.load(primary)
        if isinstance(obj, Pipeline):
            logger.info("ML: loaded yield pipeline from yield_xgb.joblib")
            return obj
        if isinstance(obj, dict) and "pipeline" in obj:
            logger.info("ML: loaded yield pipeline from yield_xgb.joblib (wrapped dict)")
            return obj["pipeline"]

    enc_p = art / "encoders.pkl"
    reg_p = art / "yield_model.pkl"
    if enc_p.is_file() and reg_p.is_file():
        enc_bundle = joblib.load(enc_p)
        reg = joblib.load(reg_p)
        prep = enc_bundle.get("preprocessor")
        if prep is not None:
            pipe = Pipeline([("prep", prep), ("model", reg)])
            logger.info("ML: assembled yield Pipeline from encoders.pkl + yield_model.pkl")
            return pipe

    ye = art / "yield_encoders.joblib"
    alt_reg = art / "yield_model.pkl"
    if ye.is_file() and alt_reg.is_file():
        enc_meta = joblib.load(ye)
        if isinstance(enc_meta, dict) and enc_meta.get("preprocessor") is not None:
            pipe = Pipeline(
                [("prep", enc_meta["preprocessor"]), ("model", joblib.load(alt_reg))]
            )
            logger.info("ML: assembled yield Pipeline from yield_encoders.joblib + yield_model.pkl")
            return pipe

    raise FileNotFoundError(
        "Yield ML artifacts missing. Expected yield_xgb.joblib or encoders.pkl + yield_model.pkl. "
        "Run: python -m ml_models.pipeline.run_all"
    )


def _yield_meta_from_disk() -> dict[str, Any]:
    art = artifacts_dir()
    for name in ("encoders.pkl", "yield_encoders.joblib"):
        p = art / name
        if p.is_file():
            try:
                raw = joblib.load(p)
                if isinstance(raw, dict):
                    return raw
            except Exception as e:
                logger.warning("Could not read %s: %s", p, e)
    return {}


def _normalize_crop_bundle(
    clf: Any, enc: dict[str, Any] | Any
) -> dict[str, Any]:
    if isinstance(enc, dict) and "classifier" in enc:
        return enc
    if not isinstance(enc, dict):
        enc = {}
    state_le = enc.get("state_encoder") or enc.get("state")
    crop_le = enc.get("crop_encoder") or enc.get("crop")
    return {
        "classifier": clf,
        "state_encoder": state_le,
        "crop_encoder": crop_le,
        "feature_order": enc.get("feature_order", ["rainfall", "temperature", "state_enc"]),
    }


def _load_crop_artifacts() -> tuple[Any, dict[str, Any]]:
    art = artifacts_dir()
    bundle_path = art / "crop_xgb.joblib"
    if bundle_path.is_file():
        raw: Any = joblib.load(bundle_path)
        if isinstance(raw, dict) and "classifier" in raw:
            logger.info("ML: loaded crop classifier from crop_xgb.joblib")
            return raw["classifier"], raw
        enc_p = art / "crop_encoders.joblib"
        if enc_p.is_file():
            enc = joblib.load(enc_p)
            bundle = _normalize_crop_bundle(raw, enc)
            logger.info("ML: loaded crop classifier from crop_xgb.joblib + crop_encoders.joblib (legacy flat)")
            return bundle["classifier"], bundle

    clf_p = art / "crop_model.pkl"
    enc_p = art / "crop_encoders.joblib"
    if clf_p.is_file() and enc_p.is_file():
        clf = joblib.load(clf_p)
        enc = joblib.load(enc_p)
        bundle = _normalize_crop_bundle(clf, enc)
        logger.info("ML: loaded crop from crop_model.pkl + crop_encoders.joblib")
        return bundle["classifier"], bundle

    raise FileNotFoundError(
        "Crop ML artifacts missing. Expected crop_xgb.joblib or crop_model.pkl + crop_encoders.joblib. "
        "Run: python -m ml_models.pipeline.run_all"
    )


def load_yield_bundle() -> tuple[Any, Any]:
    """
    Returns (model_or_pipeline, metadata_dict).

    - New: first value is sklearn Pipeline; metadata from encoders.pkl.
    - Legacy: first value is raw estimator + label encoders dict.
    """
    global _yield_model, _yield_meta
    if _yield_model is not None:
        return _yield_model, _yield_meta
    _yield_model = _load_yield_pipeline()
    _yield_meta = _yield_meta_from_disk()
    return _yield_model, _yield_meta


def load_crop_bundle() -> tuple[Any, Any]:
    """Returns (classifier, bundle_dict) with keys state_encoder, crop_encoder, classifier."""
    global _crop_model, _crop_bundle
    if _crop_model is not None and _crop_bundle is not None:
        return _crop_model, _crop_bundle
    _crop_model, _crop_bundle = _load_crop_artifacts()
    return _crop_model, _crop_bundle


def load_prophet() -> Any | None:
    global _prophet_model, _prophet_skip_load
    if _prophet_skip_load:
        return None
    if _prophet_model is not None:
        return _prophet_model
    p = artifacts_dir() / "prophet_yield.joblib"
    if not p.exists():
        logger.warning("Prophet artifact missing — forecast will use heuristic")
        return None
    try:
        _prophet_model = joblib.load(p)
        return _prophet_model
    except ModuleNotFoundError as e:
        logger.warning(
            "Prophet artifact present but import failed (%s). "
            "Install the `prophet` package (pip install prophet) or forecasts use heuristic fallback.",
            e,
        )
        _prophet_skip_load = True
        return None
    except Exception as e:
        logger.warning(
            "Failed to load prophet_yield.joblib (%s) — forecast will use heuristic.",
            e,
        )
        _prophet_skip_load = True
        return None


def preload_models() -> None:
    """Eager-load yield + crop + prophet (optional) for faster first /predict."""
    load_yield_bundle()
    load_crop_bundle()
    load_prophet()
    logger.info("ML: preload complete (yield + crop + prophet check)")


def clear_cache() -> None:
    """Reset cached handles (tests / reload)."""
    global _yield_model, _yield_meta, _crop_model, _crop_bundle, _prophet_model, _prophet_skip_load
    _yield_model = None
    _yield_meta = {}
    _crop_model = None
    _crop_bundle = None
    _prophet_model = None
    _prophet_skip_load = False
