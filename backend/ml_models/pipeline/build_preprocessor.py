"""Sklearn ColumnTransformer for yield regression (state LE-style, crop/season OHE, rain cat OHE)."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, OrdinalEncoder


def make_yield_preprocessor() -> ColumnTransformer:
    """
    state: ordinal encoding (unknown → -1) — same role as label encoding for tree/linear.
    crop, season, rainfall_category: one-hot.
    rainfall, temperature, area: numeric passthrough.

    (District is kept in training CSV for EDA but not used here so Flask /predict can
    match without a district field.)
    """
    return ColumnTransformer(
        transformers=[
            (
                "state_enc",
                OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1),
                ["state"],
            ),
            (
                "crop_ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False, max_categories=120),
                ["crop"],
            ),
            (
                "season_ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                ["season"],
            ),
            (
                "rain_cat_ohe",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                ["rainfall_category"],
            ),
            ("num", "passthrough", ["rainfall", "temperature", "area"]),
        ],
        remainder="drop",
        verbose_feature_names_out=False,
    )


def yield_X_y(df: pd.DataFrame) -> tuple[pd.DataFrame, np.ndarray]:
    """Feature matrix and target for yield regression."""
    cols = [
        "state",
        "crop",
        "season",
        "rainfall",
        "temperature",
        "area",
        "rainfall_category",
    ]
    X = df[cols].copy()
    y = df["yield"].values.astype(float)
    return X, y


def get_feature_names_after_prep(pre: ColumnTransformer, X_sample: pd.DataFrame) -> list[str]:
    pre.fit(X_sample)
    try:
        return list(pre.get_feature_names_out())
    except Exception:
        return [f"f{i}" for i in range(pre.transform(X_sample).shape[1])]
