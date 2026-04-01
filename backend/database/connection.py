"""MongoDB connection — lazy singleton with graceful degradation."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pymongo.database import Database

logger = logging.getLogger(__name__)

_client = None
_db: Database | None = None
_available = False


def init_mongo(uri: str, db_name: str) -> bool:
    """Initialize Mongo client. Returns True if connection usable."""
    global _client, _db, _available
    if not uri:
        logger.info("MongoDB not configured — API runs without persistence (expected for local dev)")
        _available = False
        return False
    try:
        from pymongo import MongoClient

        _client = MongoClient(uri, serverSelectionTimeoutMS=2000, connectTimeoutMS=2000)
        _client.admin.command("ping")
        _db = _client[db_name]
        _available = True
        logger.info("MongoDB connected: %s", db_name)
        return True
    except Exception as e:
        msg = str(e).split("\n")[0][:200]
        logger.warning("MongoDB not reachable — running without DB (%s)", msg)
        _client = None
        _db = None
        _available = False
        return False


def get_db() -> Database | None:
    return _db


def mongo_available() -> bool:
    return _available
