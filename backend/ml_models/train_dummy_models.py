"""
Train and persist dummy models for local development / CI.

Uses scikit-learn ensembles (portable on all platforms). For XGBoost variants,
install OpenMP on macOS (`brew install libomp`) and swap estimators in this file.

Run from `backend/`:
  python -m ml_models.train_dummy_models
"""

from __future__ import annotations

import random
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

try:
    from prophet import Prophet
except ImportError:
    Prophet = None

BASE = Path(__file__).resolve().parent
ART = BASE / "artifacts"
ART.mkdir(parents=True, exist_ok=True)

random.seed(42)
np.random.seed(42)

STATES = [
    "Maharashtra",
    "Punjab",
    "Karnataka",
    "Uttar Pradesh",
    "Tamil Nadu",
    "West Bengal",
    "Gujarat",
    "Rajasthan",
    "Madhya Pradesh",
    "Bihar",
    "Odisha",
    "Telangana",
    "Assam",
    "Haryana",
    "Kerala",
]
CROPS = [
    "rice",
    "wheat",
    "maize",
    "cotton",
    "sugarcane",
    "soybean",
    "groundnut",
    "millets",
    "pulses",
    "potato",
]
SEASONS = ["kharif", "rabi", "zaid"]


def _synth_yield_rows(n: int = 5000) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        st = random.choice(STATES)
        cr = random.choice(CROPS)
        se = random.choice(SEASONS)
        rain = float(np.clip(np.random.normal(900, 350), 200, 2800))
        temp = float(np.clip(np.random.normal(27, 5), 10, 45))
        area = float(np.clip(np.random.lognormal(2.5, 0.6), 0.5, 200))
        base = 2.0 + CROPS.index(cr) * 0.15
        y = (
            base
            * (rain / 900) ** 0.3
            * (1 - abs(temp - 26) / 80)
            * (1 + random.gauss(0, 0.12))
        )
        y = float(np.clip(y, 0.5, 12))
        rows.append(
            {
                "state": st,
                "crop": cr,
                "season": se,
                "rainfall": rain,
                "temperature": temp,
                "area": area,
                "yield": y,
            }
        )
    return pd.DataFrame(rows)


def train_yield_model(df: pd.DataFrame) -> tuple:
    le_s = LabelEncoder().fit(STATES)
    le_c = LabelEncoder().fit(CROPS)
    le_z = LabelEncoder().fit(SEASONS)
    X = np.column_stack(
        [
            le_s.transform(df["state"]),
            le_c.transform(df["crop"]),
            le_z.transform(df["season"]),
            df["rainfall"].values,
            df["temperature"].values,
            df["area"].values,
        ]
    )
    y = df["yield"].values
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42)
    model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        random_state=42,
    )
    model.fit(X_tr, y_tr)
    encoders = {"state": le_s, "crop": le_c, "season": le_z}
    return model, encoders


def _synth_crop_rows(n: int = 4000) -> pd.DataFrame:
    rows = []
    for _ in range(n):
        rain = float(np.clip(np.random.normal(850, 400), 150, 3000))
        temp = float(np.clip(np.random.normal(26, 6), 8, 46))
        soil = random.choice(["alluvial", "black", "red", "laterite", "unknown"])
        region = random.choice(STATES)
        if rain < 500:
            best = random.choice(["millets", "groundnut", "maize"])
        elif rain > 1600:
            best = random.choice(["rice", "sugarcane"])
        elif temp > 32:
            best = random.choice(["cotton", "millets"])
        else:
            best = random.choice(CROPS)
        rows.append(
            {
                "rainfall": rain,
                "temperature": temp,
                "soil": soil,
                "region": region,
                "crop": best,
            }
        )
    return pd.DataFrame(rows)


def train_crop_model(df: pd.DataFrame) -> tuple:
    le_soil = LabelEncoder().fit(df["soil"].unique())
    le_reg = LabelEncoder().fit(STATES)
    le_crop = LabelEncoder().fit(CROPS)
    X = np.column_stack(
        [
            df["rainfall"].values,
            df["temperature"].values,
            le_soil.transform(df["soil"]),
            le_reg.transform(df["region"]),
        ]
    )
    y = le_crop.transform(df["crop"])
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.15, random_state=42)
    model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.1,
        random_state=42,
    )
    model.fit(X_tr, y_tr)
    encoders = {"soil": le_soil, "region": le_reg, "crop": le_crop}
    return model, encoders


def train_prophet() -> object | None:
    if Prophet is None:
        print("Prophet not installed — skip Prophet artifact", file=sys.stderr)
        return None
    dates = pd.date_range("2018-01-01", periods=60, freq="MS")
    base = 3.0
    vals = []
    for i in range(len(dates)):
        base = base + np.sin(i / 5) * 0.05 + random.gauss(0, 0.08)
        vals.append(max(1.5, base))
    pdf = pd.DataFrame({"ds": dates, "y": vals})
    m = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
    )
    m.fit(pdf)
    return m


def main() -> None:
    print("Training yield model (sklearn GradientBoostingRegressor)...")
    ydf = _synth_yield_rows(6000)
    ym, ye = train_yield_model(ydf)
    joblib.dump(ym, ART / "yield_xgb.joblib")
    joblib.dump(ye, ART / "yield_encoders.joblib")
    print("Saved yield model -> yield_xgb.joblib (sklearn; filename kept for loader compatibility)")

    print("Training crop recommendation model (sklearn GradientBoostingClassifier)...")
    cdf = _synth_crop_rows(5000)
    cm, ce = train_crop_model(cdf)
    joblib.dump(cm, ART / "crop_xgb.joblib")
    joblib.dump(ce, ART / "crop_encoders.joblib")
    print("Saved crop model.")

    pm = train_prophet()
    if pm is not None:
        joblib.dump(pm, ART / "prophet_yield.joblib")
        print("Saved Prophet model.")

    print("Done. Artifacts in", ART)


if __name__ == "__main__":
    main()
