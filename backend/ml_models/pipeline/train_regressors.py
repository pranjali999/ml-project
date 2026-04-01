"""Train multiple regressors, evaluate, select best by R²."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.ensemble import HistGradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeRegressor

try:
    from xgboost import XGBRegressor
except Exception:
    XGBRegressor = None  # type: ignore  # missing OpenMP / libomp on some macOS installs

from .build_preprocessor import make_yield_preprocessor, yield_X_y
from .config import RANDOM_STATE, TEST_SIZE


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    return {
        "r2": float(r2_score(y_true, y_pred)),
        "rmse": float(np.sqrt(mean_squared_error(y_true, y_pred))),
        "mae": float(mean_absolute_error(y_true, y_pred)),
    }


def train_and_compare(df: pd.DataFrame) -> tuple[Pipeline, pd.DataFrame, dict]:
    X_df, y = yield_X_y(df)
    X_train, X_test, y_train, y_test = train_test_split(
        X_df,
        y,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    pre = make_yield_preprocessor()

    models = {
        "LinearRegression": LinearRegression(),
        "HistGradientBoosting": HistGradientBoostingRegressor(
            max_iter=400,
            max_depth=12,
            learning_rate=0.07,
            min_samples_leaf=12,
            l2_regularization=0.08,
            early_stopping=True,
            validation_fraction=0.12,
            n_iter_no_change=25,
            random_state=RANDOM_STATE,
        ),
        "DecisionTreeRegressor": DecisionTreeRegressor(
            max_depth=12, min_samples_leaf=8, random_state=RANDOM_STATE
        ),
        "RandomForestRegressor": RandomForestRegressor(
            n_estimators=120,
            max_depth=16,
            min_samples_leaf=4,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }
    if XGBRegressor is not None:
        models["XGBRegressor"] = XGBRegressor(  # type: ignore[call-arg]
            n_estimators=200,
            max_depth=8,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=RANDOM_STATE,
            n_jobs=-1,
        )

    rows = []
    fitted: dict[str, Pipeline] = {}
    for name, est in models.items():
        pipe = Pipeline([("prep", clone(pre)), ("model", est)])
        pipe.fit(X_train, y_train)
        pred = pipe.predict(X_test)
        m = _metrics(y_test, pred)
        m["model"] = name
        rows.append(m)
        fitted[name] = pipe

    table = pd.DataFrame(rows).set_index("model")
    if XGBRegressor is None:
        print(
            "Note: XGBoost skipped (import failed — on macOS install OpenMP: brew install libomp)."
        )
    best_name = table["r2"].idxmax()
    best_pipe = fitted[best_name]

    meta = {
        "best_model_name": best_name,
        "metrics_table": table,
        "test_y": y_test,
        "test_pred": best_pipe.predict(X_test),
    }
    return best_pipe, table, meta
