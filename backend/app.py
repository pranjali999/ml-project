"""
AgriMind — Flask application entrypoint.

Run (development):
  export FLASK_APP=app.py
  flask run --port 8000

Or:
  python app.py
  (default PORT=8000 — avoids macOS AirPlay on :5000; override with PORT=)
"""

from __future__ import annotations

import logging
import os
import sys

from flask import Flask, jsonify, send_file
from flask_cors import CORS

# Ensure backend root is on path
_ROOT = os.path.dirname(os.path.abspath(__file__))
if _ROOT not in sys.path:
    sys.path.insert(0, _ROOT)

from config import get_config
from database.connection import init_mongo
from routes.main import api_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


def create_app() -> Flask:
    cfg = get_config()
    app = Flask(__name__)
    app.config["SECRET_KEY"] = cfg.SECRET_KEY
    app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

    # Wildcard + supports_credentials=True breaks credentialed CORS in browsers.
    # Default allows Vite dev + direct API tabs; override with CORS_ORIGINS=comma,separated
    _default_origins = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:4173,http://127.0.0.1:4173,"
        "http://localhost:8000,http://127.0.0.1:8000,*"
    )
    CORS(
        app,
        resources={
            r"/*": {
                "origins": [o.strip() for o in os.getenv("CORS_ORIGINS", _default_origins).split(",") if o.strip()],
            }
        },
        supports_credentials=False,
    )

    init_mongo(cfg.MONGODB_URI, cfg.MONGODB_DB)
    try:
        from ml_models.loader import preload_models

        preload_models()
    except Exception as e:
        logging.getLogger(__name__).warning("ML preload skipped: %s", e)

    app.register_blueprint(api_bp)

    @app.get("/favicon.ico")
    def favicon():
        """Browsers request this when opening the API URL in a tab — avoids 404 noise in logs."""
        svg_path = os.path.normpath(os.path.join(_ROOT, "..", "public", "favicon.svg"))
        if os.path.isfile(svg_path):
            return send_file(svg_path, mimetype="image/svg+xml")
        return ("", 204)

    @app.get("/")
    def root():
        """So `GET /` is never 404 when someone opens the API base URL in a browser."""
        return jsonify(
            {
                "ok": True,
                "service": "agrimind-api",
                "message": "AI-Powered Agricultural Decision Support API",
                "docs": "See backend/README.md for endpoints",
                "endpoints": {
                    "health": "GET /health",
                    "predict": "POST /predict",
                    "recommend": "POST /recommend",
                    "profit": "POST /profit",
                    "forecast": "POST /forecast",
                    "explain": "POST /explain",
                    "risk": "POST /risk",
                    "chatbot": "POST /chatbot",
                    "rag": "POST /rag",
                    "history": "POST /history",
                    "weather": "GET /weather/current?city=",
                },
            }
        )

    @app.errorhandler(404)
    def not_found(_e):
        return {"ok": False, "error": "not_found"}, 404

    @app.errorhandler(500)
    def server_err(_e):
        return {"ok": False, "error": "internal_server_error"}, 500

    return app


app = create_app()


def _pick_port(preferred: int, attempts: int = 25) -> int:
    """Bind to the first free port starting at `preferred` (common dev pain: 8000 already in use)."""
    import socket

    for p in range(preferred, preferred + attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                s.bind(("0.0.0.0", p))
                return p
            except OSError:
                continue
    raise RuntimeError(f"No free TCP port in range {preferred}–{preferred + attempts - 1}")


if __name__ == "__main__":
    preferred = int(os.getenv("PORT", "8000"))
    port = _pick_port(preferred)
    if port != preferred:
        logging.warning("Port %s was busy — using %s instead", preferred, port)
    # Default off: Werkzeug reloader + custom port logic is confusing; use FLASK_DEBUG=1 when needed.
    debug = bool(int(os.getenv("FLASK_DEBUG", "0")))
    logging.info(
        "AgriMind API → http://127.0.0.1:%s/  (health: /health)", port
    )
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug,
        use_reloader=debug,
    )
