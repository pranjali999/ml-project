#!/usr/bin/env python3
"""
Download real Indian crop production statistics (APY-style) for training.

Source mirror: vish-manit/Crop-Production-Statistics-in-India (public GitHub).
Verify licensing for your use case.

Usage (from repo root or backend/):
  python scripts/download_real_crop_data.py
  python scripts/download_real_crop_data.py --max-rows 150000

Output: backend/data/crop_production_india.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

URL = "https://raw.githubusercontent.com/vish-manit/Crop-Production-Statistics-in-India/master/APY.csv"
DEFAULT_OUT = Path(__file__).resolve().parents[1] / "data" / "crop_production_india.csv"


def main() -> None:
    parser = argparse.ArgumentParser(description="Download APY crop production CSV for AgriMind training.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help="Output CSV path.")
    parser.add_argument(
        "--max-rows",
        type=int,
        default=0,
        help="Random subsample size (0 = full ~345k rows). Use e.g. 150000 for faster training.",
    )
    args = parser.parse_args()

    print(f"Downloading {URL} …")
    try:
        df = pd.read_csv(URL, low_memory=False)
    except Exception as e:
        print(f"Download failed: {e}", file=sys.stderr)
        print("Try again with network access, or place your own CSV at:", DEFAULT_OUT, file=sys.stderr)
        sys.exit(1)

    if args.max_rows > 0 and len(df) > args.max_rows:
        df = df.sample(n=args.max_rows, random_state=42).reset_index(drop=True)
        print(f"Subsampled to {len(df)} rows.")

    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)
    print(f"Wrote {len(df)} rows -> {args.out}")
    print("Train models:  cd backend && python -m ml_models.pipeline.run_all")


if __name__ == "__main__":
    main()
