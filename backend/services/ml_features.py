"""
Inference-time feature construction — must match training pipeline
(`ml_models.pipeline.build_preprocessor` + `features.add_yield_and_rainfall_category`).
"""

from __future__ import annotations

import pandas as pd

from utils.state_normalize import canonicalize_state


def rainfall_category(rainfall: float) -> str:
    r = float(rainfall)
    if r < 500:
        return "low"
    if r <= 1000:
        return "medium"
    return "high"


def yield_inference_frame(
    state: str,
    crop: str,
    season: str,
    rainfall: float,
    temperature: float,
    area: float,
) -> pd.DataFrame:
    """Single-row DataFrame with the exact columns the trained ColumnTransformer expects."""
    return pd.DataFrame(
        [
            {
                "state": canonicalize_state(state),
                "crop": str(crop).strip().lower(),
                "season": str(season).strip().lower(),
                "rainfall": float(rainfall),
                "temperature": float(temperature),
                "area": float(area),
                "rainfall_category": rainfall_category(float(rainfall)),
            }
        ]
    )
