#!/usr/bin/env bash
# Reliable dev start for macOS/Linux — fixes matplotlib cache + ensures venv + ML artifacts.
set -e
cd "$(dirname "$0")"

export MPLCONFIGDIR="${PWD}/.mplconfig"
mkdir -p "$MPLCONFIGDIR"

if [[ ! -d .venv ]]; then
  echo "Creating virtualenv..."
  python3 -m venv .venv
fi

echo "Installing dependencies (if needed)..."
.venv/bin/pip install -q -r requirements.txt

if [[ ! -f data/crop_production_india.csv ]]; then
  echo "No real crop data CSV — downloading public APY extract (200k rows; full file: run scripts without --max-rows)..."
  .venv/bin/python scripts/download_real_crop_data.py --max-rows 200000
fi

if [[ ! -f ml_models/artifacts/yield_xgb.joblib ]]; then
  echo "Training ML pipeline on real statistics (first run — may take several minutes)..."
  .venv/bin/python -m ml_models.pipeline.run_all
fi

# Optional: copy env template
if [[ ! -f .env && -f .env.example ]]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit if you use MongoDB or APIs."
fi

echo ""
echo "Starting server (Ctrl+C to stop)..."
echo "If port 8000 is busy, the app will pick the next free port automatically."
echo ""
exec .venv/bin/python app.py
