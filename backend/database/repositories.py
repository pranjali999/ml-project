"""MongoDB repositories for users, predictions, history."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from .connection import get_db, mongo_available

logger = logging.getLogger(__name__)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_user(user_id: str, email: str | None = None) -> dict[str, Any]:
    db = get_db()
    if not db or not mongo_available():
        return {"ok": False, "reason": "mongodb_unavailable"}
    doc = {
        "user_id": user_id,
        "email": email,
        "updated_at": _now(),
    }
    db.users.update_one(
        {"user_id": user_id},
        {"$set": doc, "$setOnInsert": {"created_at": _now()}},
        upsert=True,
    )
    return {"ok": True}


def save_prediction(
    user_id: str,
    input_payload: dict[str, Any],
    prediction: dict[str, Any],
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    db = get_db()
    if not db or not mongo_available():
        return {"ok": False, "reason": "mongodb_unavailable"}
    pid = str(uuid.uuid4())
    rec = {
        "prediction_id": pid,
        "user_id": user_id,
        "input": input_payload,
        "prediction": prediction,
        "meta": meta or {},
        "created_at": _now(),
    }
    db.predictions.insert_one(rec)
    hist = {
        "user_id": user_id,
        "prediction_id": pid,
        "summary": {
            "yield": prediction.get("yield"),
            "crop": prediction.get("recommended_crop") or input_payload.get("crop"),
        },
        "created_at": _now(),
    }
    db.history.insert_one(hist)
    return {"ok": True, "prediction_id": pid}


def list_history(user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    db = get_db()
    if not db or not mongo_available():
        return []
    cursor = (
        db.predictions.find({"user_id": user_id})
        .sort("created_at", -1)
        .limit(limit)
    )
    out = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        if "created_at" in doc and doc["created_at"]:
            doc["created_at"] = doc["created_at"].isoformat()
        out.append(doc)
    return out
