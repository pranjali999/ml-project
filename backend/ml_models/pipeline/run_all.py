"""
End-to-end training: data → EDA → yield regressors → crop classifier → SHAP → export artifacts.

Run from `backend/`:
  python -m ml_models.pipeline.run_all
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib

from .config import ARTIFACTS_DIR, EDA_DIR, MAX_TRAIN_ROWS
from .data_loader import load_dataset
from .eda import run_eda
from .features import add_yield_and_rainfall_category
from .preprocess import clean_raw_frame
from .shap_xai import run_shap_summary
from .train_crop_classifier import train_crop_rf
from .train_regressors import train_and_compare


def _maybe_train_prophet() -> None:
    try:
        from ml_models.train_dummy_models import train_prophet

        pm = train_prophet()
        if pm is not None:
            joblib.dump(pm, ARTIFACTS_DIR / "prophet_yield.joblib")
            print("Saved prophet_yield.joblib")
    except Exception as e:
        print(f"Prophet optional: {e}", file=sys.stderr)


def main() -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    EDA_DIR.mkdir(parents=True, exist_ok=True)

    print("=== 1. Load dataset ===")
    raw, src = load_dataset(verbose=True)
    if len(raw) > MAX_TRAIN_ROWS:
        raw = raw.sample(n=MAX_TRAIN_ROWS, random_state=42).reset_index(drop=True)
        print(f"Subsampled to MAX_TRAIN_ROWS={MAX_TRAIN_ROWS} (set AGRIMIND_MAX_TRAIN_ROWS to change).")
    print(f"Source: {src}, rows={len(raw)}")

    print("=== 2. Preprocess ===")
    df = clean_raw_frame(raw)
    print(f"After cleaning: {len(df)} rows")

    print("=== 3. Feature engineering ===")
    df = add_yield_and_rainfall_category(df)
    print(f"Yield stats: mean={df['yield'].mean():.3f}, std={df['yield'].std():.3f}")

    print("=== 4. EDA (saving plots) ===")
    plot_paths = run_eda(df, EDA_DIR)
    for p in plot_paths:
        print(f"  saved {p}")

    print("=== 5. Train / test yield models ===")
    best_pipe, table, meta = train_and_compare(df)
    print("\nModel comparison (test set):")
    print(table.round(4).to_string())
    print(f"\nBest model (highest R²): {meta['best_model_name']}")

    model_step = best_pipe.named_steps["model"]
    joblib.dump(model_step, ARTIFACTS_DIR / "yield_model.pkl")
    print(f"\nSaved bare regressor -> {ARTIFACTS_DIR / 'yield_model.pkl'}")

    encoders_bundle = {
        "preprocessor": best_pipe.named_steps["prep"],
        "best_model_name": meta["best_model_name"],
        "yield_input_columns": [
            "state",
            "crop",
            "season",
            "rainfall",
            "temperature",
            "area",
            "rainfall_category",
        ],
    }
    joblib.dump(encoders_bundle, ARTIFACTS_DIR / "encoders.pkl")
    print(f"Saved encoders (preprocessor + metadata) -> {ARTIFACTS_DIR / 'encoders.pkl'}")

    # Flask loader: full sklearn Pipeline
    joblib.dump(best_pipe, ARTIFACTS_DIR / "yield_xgb.joblib")
    joblib.dump(
        {
            "pipeline": best_pipe,
            "preprocessor": best_pipe.named_steps["prep"],
            "regressor": model_step,
            "kind": "sklearn_pipeline",
        },
        ARTIFACTS_DIR / "yield_encoders.joblib",
    )
    print(f"Saved Flask bundle -> {ARTIFACTS_DIR / 'yield_xgb.joblib'}")

    print("\n=== 6. Crop recommendation (RandomForestClassifier) ===")
    clf, le_state, le_crop, cmeta = train_crop_rf(df)
    print(f"Crop model test accuracy: {cmeta['accuracy']:.4f}")
    print(cmeta["classification_report"])

    joblib.dump(clf, ARTIFACTS_DIR / "crop_model.pkl")
    crop_bundle = {
        "classifier": clf,
        "state_encoder": le_state,
        "crop_encoder": le_crop,
        "feature_order": ["rainfall", "temperature", "state_enc"],
    }
    joblib.dump(crop_bundle, ARTIFACTS_DIR / "crop_xgb.joblib")
    joblib.dump(
        {"state": le_state, "crop": le_crop, "kind": "crop_rf_state_rain_temp"},
        ARTIFACTS_DIR / "crop_encoders.joblib",
    )
    print(f"Saved {ARTIFACTS_DIR / 'crop_model.pkl'} and crop_xgb.joblib")

    print("\n=== 7. SHAP (XAI) ===")
    shap_path = EDA_DIR / "shap_summary_yield.png"
    p = run_shap_summary(best_pipe, df, shap_path)
    if p:
        print(f"Saved SHAP summary -> {p}")
    else:
        print("SHAP summary plot not generated (see logs above).")

    print("\n=== 8. Optional Prophet (forecast artifact) ===")
    _maybe_train_prophet()

    print("\nDone. Artifacts under:", ARTIFACTS_DIR)


if __name__ == "__main__":
    main()
