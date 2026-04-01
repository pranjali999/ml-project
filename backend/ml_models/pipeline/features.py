"""Feature engineering: yield, rainfall categories, encodings helpers."""

from __future__ import annotations

import numpy as np
import pandas as pd


def add_yield_and_rainfall_category(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    out["yield"] = out["production"] / out["area"].replace(0, np.nan)
    out = out[np.isfinite(out["yield"])]
    out = out[out["yield"] > 0]
    # Real APY mixes units and outliers; keep physically plausible tonnes/hectare for modelling.
    y = out["yield"]
    lo, hi = float(y.quantile(0.01)), float(y.quantile(0.99))
    lo = max(0.02, lo)
    hi = min(45.0, max(hi, 0.5))
    out = out[(out["yield"] >= lo) & (out["yield"] <= hi)]
    out = out.reset_index(drop=True)
    out["yield"] = out["yield"].clip(lower=0.03, upper=min(hi, 40.0))

    def _cat(r: float) -> str:
        if r < 500:
            return "low"
        if r <= 1000:
            return "medium"
        return "high"

    out["rainfall_category"] = out["rainfall"].map(_cat)
    return out.reset_index(drop=True)
