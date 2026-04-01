"""Prophet-based yield trend forecast with heuristic fallback."""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd

from ml_models.loader import load_prophet

logger = logging.getLogger(__name__)


def forecast_yield_trend(periods: int = 6, history: list[dict] | None = None) -> dict:
    """
    Returns future periods of forecasted yield index (tonnes/ha scale).
    """
    m = load_prophet()
    if m is not None:
        future = m.make_future_dataframe(periods=periods, freq="MS")
        fc = m.predict(future)
        tail = fc.tail(periods)
        points = [
            {
                "ds": row["ds"].isoformat() if hasattr(row["ds"], "isoformat") else str(row["ds"]),
                "yhat": float(row["yhat"]),
                "yhat_lower": float(row.get("yhat_lower", row["yhat"])),
                "yhat_upper": float(row.get("yhat_upper", row["yhat"])),
            }
            for _, row in tail.iterrows()
        ]
        return {"method": "prophet", "forecast": points}

    # Fallback: simple damped trend from optional history or synthetic
    base = 3.0
    if history and len(history) >= 3:
        ys = [float(h.get("yield", h.get("y", 3))) for h in history[-12:]]
        base = float(np.mean(ys))
    pts = []
    for i in range(periods):
        t = base + 0.02 * i + 0.05 * np.sin(i / 2)
        pts.append(
            {
                "ds": f"period_{i+1}",
                "yhat": float(max(0.5, t)),
                "yhat_lower": float(max(0.3, t - 0.2)),
                "yhat_upper": float(t + 0.2),
            }
        )
    return {
        "method": "heuristic_fallback",
        "forecast": pts,
        "note": "Prophet artifact missing — train with ml_models.train_dummy_models",
    }
