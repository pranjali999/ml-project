"""Cleaning: missing values, duplicates, string normalization."""

from __future__ import annotations

import numpy as np
import pandas as pd

from utils.state_normalize import canonicalize_state


def clean_raw_frame(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out.columns = [str(c).strip() for c in out.columns]
    text_cols = ["state", "district", "crop", "season"]
    for c in text_cols:
        if c in out.columns:
            out[c] = out[c].astype(str).str.strip().str.lower()
    if "state" in out.columns:
        def _state_cell(v: object) -> object:
            if not isinstance(v, str) or v.lower() in ("nan", "", "none"):
                return np.nan
            return canonicalize_state(v)

        out["state"] = out["state"].map(_state_cell)
    num_cols = ["area", "rainfall", "temperature", "production"]
    for c in num_cols:
        if c in out.columns:
            out[c] = pd.to_numeric(out[c], errors="coerce")
    out = out.dropna(subset=["state", "crop", "season", "area", "production"])
    out = out[out["area"] > 0]
    out = out.drop_duplicates()
    out = out.reset_index(drop=True)
    return out
