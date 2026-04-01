# AgriMind — AI-Powered Agricultural Decision Support System

Premium React frontend: predictions, dashboards, India map, explainability, chat UI, voice input, and local history — with light/dark theme and Framer Motion animations.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+ (recommended: current LTS)

## Install

```bash
cd MLproject
npm install
cp .env.example .env
```

Optional: set `VITE_API_BASE_URL` in `.env` (defaults to `http://127.0.0.1:8000`). Start the Flask backend from `backend/` (see `backend/README.md`).

## Development

```bash
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`). The UI calls the API at `VITE_API_BASE_URL` (Axios, see `src/api.js`).

## Production build

```bash
npm run build
npm run preview
```

`preview` serves the contents of `dist/` for a local production check.

## Lint

```bash
npm run lint
```

## Tech stack

- **Axios** (Flask API at `src/api.js`)
- **React** + **Vite**
- **Tailwind CSS** (v4 via `@tailwindcss/vite`)
- **Framer Motion**
- **Recharts**
- **React Router**
- **Leaflet** + **react-leaflet** (India states GeoJSON from the network; quick-pick chips work offline)

## Notes

- **Predictions, dashboard charts, chat, and explainability** use the **Flask backend** (`POST /predict`, `/forecast`, `/recommend`, `/risk`, `/chatbot`, `/explain`). Run `backend/run.sh` or `python app.py` first.
- **Voice input** uses the Web Speech API (best in Chromium-based browsers).
- **Map** loads state boundaries over HTTPS; if the request fails, use the quick-select chips to navigate with prefilled state.
