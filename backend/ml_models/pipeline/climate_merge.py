"""Attach state-level climate normals when the crop CSV has no (or incomplete) weather columns."""

from __future__ import annotations

import pandas as pd

from utils.state_normalize import canonicalize_state

from .config import DATA_DIR

_CLIMATE_PATH = DATA_DIR / "india_state_climate_normals.csv"


def _climate_table() -> pd.DataFrame:
    c = pd.read_csv(_CLIMATE_PATH)
    c["state_key"] = c["state"].astype(str).str.strip().str.lower()
    return c.set_index("state_key")[["rainfall_mm", "temp_c"]]


def merge_climate_features(df: pd.DataFrame, verbose: bool = True) -> pd.DataFrame:
    """Fill rainfall / temperature from `india_state_climate_normals.csv` (annual state averages)."""
    out = df.copy()

    def _canon(v):
        if pd.isna(v):
            return v
        return canonicalize_state(v)

    out["state"] = out["state"].map(_canon)
    sk = out["state"].map(lambda x: str(x).strip().lower() if pd.notna(x) else "")
    clin = _climate_table()
    r_from_state = sk.map(clin["rainfall_mm"])
    t_from_state = sk.map(clin["temp_c"])
    r_from_state = r_from_state.fillna(float(r_from_state.median()))
    t_from_state = t_from_state.fillna(float(t_from_state.median()))

    if "rainfall" in out.columns:
        orig = pd.to_numeric(out["rainfall"], errors="coerce")
        out["rainfall"] = orig.fillna(r_from_state)
    else:
        out["rainfall"] = r_from_state
        if verbose:
            print(
                "Added rainfall from state climate normals (annual mm; see data/india_state_climate_normals.csv)."
            )

    if "temperature" in out.columns:
        orig = pd.to_numeric(out["temperature"], errors="coerce")
        out["temperature"] = orig.fillna(t_from_state)
    else:
        out["temperature"] = t_from_state
        if verbose:
            print(
                "Added temperature from state climate normals (mean annual °C; same file)."
            )

    return out
