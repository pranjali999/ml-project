# AgriMind API — Flask backend

Production-style REST API for the **AI-Powered Agricultural Decision Support System**: ML predictions (scikit-learn ensembles + Prophet), SHAP explainability, rule-based risk and suggestions, optional MongoDB persistence, OpenWeather helpers, chat (rules + optional OpenAI), and LangChain + FAISS RAG.

## Quick start (easiest)

From the `backend` folder:

```bash
./run.sh
```

This creates the venv if needed, installs dependencies, trains ML artifacts if missing, then starts the API. **If port 8000 is already in use**, the app automatically uses the next free port (8001, 8002, …) and prints it in the log.

Then open **http://127.0.0.1:8000/** (or the port shown) and **http://127.0.0.1:8000/health**.

## Manual start

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Train / refresh dummy models (joblib under ml_models/artifacts/)
python -m ml_models.train_dummy_models
python app.py
# → http://127.0.0.1:8000/health (or next free port)
```

Set `FLASK_DEBUG=1` for the Flask reloader during development.

### Environment

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | e.g. `mongodb://localhost:27017` — if unset, DB features degrade gracefully |
| `MONGODB_DB` | Database name (default `agrimind`) |
| `OPENWEATHER_API_KEY` | Current weather for `/weather/current` |
| `OPENAI_API_KEY` | Optional — enables LLM replies in `/chatbot` |
| `CORS_ORIGINS` | Comma-separated origins (default `*`) |

## API summary

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness |
| POST | `/predict` | Yield, profit, recommended crop, risk, suggestions |
| POST | `/recommend` | Crop recommendation only |
| POST | `/profit` | Profit from yield × price − cost |
| POST | `/forecast` | Prophet yield trend (or heuristic fallback) |
| POST | `/explain` | SHAP-style feature effects |
| POST | `/risk` | Rainfall-based risk band |
| POST | `/chatbot` | Agronomy assistant (rules; OpenAI if configured) |
| POST | `/rag` | LangChain + FAISS over `data/agriculture_knowledge.txt` |
| POST | `/history` | `action: save \| list` — MongoDB history |
| GET | `/weather/current?city=` | OpenWeather snapshot |

### Example: predict

```bash
curl -s -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"state":"Maharashtra","crop":"rice","season":"kharif","rainfall":900,"temperature":28,"area":10}'
```

### Example: history

```bash
curl -s -X POST http://127.0.0.1:8000/history \
  -H "Content-Type: application/json" \
  -d '{"action":"save","user_id":"demo","input":{},"prediction":{"yield":3.2}}'

curl -s -X POST http://127.0.0.1:8000/history \
  -H "Content-Type: application/json" \
  -d '{"action":"list","user_id":"demo","limit":20}'
```

## ML notes

- **Training script** `ml_models/train_dummy_models.py` uses **scikit-learn** `GradientBoosting*` estimators for portability (macOS/Linux without extra OpenMP). Artifact filenames `yield_xgb.joblib` / `crop_xgb.joblib` are kept for compatibility with the loader.
- To use **XGBoost** end-to-end, install [OpenMP on macOS](https://xgboost.readthedocs.io/en/stable/install.html) (`brew install libomp`), then swap estimators in the training script to `XGBRegressor` / `XGBClassifier` and retrain.
- **Voice**: send transcribed text as `voice_text` on `/predict` for extra suggestion cues.

## Production

```bash
gunicorn -w 4 -b 0.0.0.0:8000 "app:app"
```

## Project layout

```
backend/
├── app.py
├── config/
├── routes/
├── models/          # Pydantic request schemas
├── services/        # ML + business logic
├── utils/
├── database/
├── ml_models/
│   ├── train_dummy_models.py
│   └── artifacts/   # joblib (generate via training script)
└── data/            # RAG corpus
```
