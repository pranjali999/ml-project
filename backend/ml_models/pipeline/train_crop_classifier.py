"""RandomForestClassifier: rainfall + temperature + state → crop."""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

from .config import RANDOM_STATE, TEST_SIZE


def build_crop_training_frame(df: pd.DataFrame) -> pd.DataFrame:
    """One row per original record with numeric inputs and crop label."""
    return df[["rainfall", "temperature", "state", "crop"]].dropna().copy()


def train_crop_rf(df: pd.DataFrame) -> tuple[RandomForestClassifier, LabelEncoder, LabelEncoder, dict]:
    d = build_crop_training_frame(df)
    le_state = LabelEncoder()
    le_crop = LabelEncoder()
    d["state_enc"] = le_state.fit_transform(d["state"])
    y = le_crop.fit_transform(d["crop"])
    X = d[["rainfall", "temperature", "state_enc"]].values

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
        )

    clf = RandomForestClassifier(
        n_estimators=200,
        max_depth=16,
        min_samples_leaf=3,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)
    pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, pred))
    report = classification_report(
        y_test, pred, target_names=le_crop.classes_, zero_division=0
    )
    meta = {
        "accuracy": acc,
        "classification_report": report,
        "X_test": X_test,
        "y_test": y_test,
        "y_pred": pred,
    }
    return clf, le_state, le_crop, meta
