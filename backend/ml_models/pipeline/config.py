"""Paths and constants for the training pipeline."""

from __future__ import annotations

import os
from pathlib import Path

# backend/ml_models/pipeline/config.py -> backend/
BACKEND_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = BACKEND_ROOT / "data"
ARTIFACTS_DIR = BACKEND_ROOT / "ml_models" / "artifacts"
EDA_DIR = ARTIFACTS_DIR / "eda"

# Real APY-style CSV — download: python scripts/download_real_crop_data.py
DEFAULT_DATA_CSV = DATA_DIR / "crop_production_india.csv"

RANDOM_STATE = 42
TEST_SIZE = 0.2

ENV_DATA_PATH = os.environ.get("CROP_DATA_CSV", "")

# Cap rows for faster local training (full APY is ~345k rows).
MAX_TRAIN_ROWS = int(os.environ.get("AGRIMIND_MAX_TRAIN_ROWS", "200000"))

# Dev-only: allow synthetic data if no CSV is present (not real-world).
USE_SYNTHETIC_FALLBACK = os.environ.get("AGRIMIND_USE_SYNTHETIC_DATA", "").strip().lower() in (
    "1",
    "true",
    "yes",
)
