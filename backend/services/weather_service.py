"""OpenWeather API helpers."""

from __future__ import annotations

import logging
from typing import Any

import requests

from config import get_config

logger = logging.getLogger(__name__)


def fetch_weather_by_city(city: str, country_code: str = "IN") -> dict[str, Any]:
    """
    Fetch current weather — returns rainfall proxy (mm from rain/snow if any) and temp.
    OpenWeather One Call / 2.5 weather returns rain.1h when available.
    """
    cfg = get_config()
    key = cfg.OPENWEATHER_API_KEY
    if not key:
        return {
            "ok": False,
            "error": "OPENWEATHER_API_KEY not configured",
        }
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "q": f"{city},{country_code}",
        "appid": key,
        "units": cfg.OPENWEATHER_UNITS,
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        logger.exception("Weather fetch failed")
        return {"ok": False, "error": str(e)}

    main = data.get("main", {})
    rain = data.get("rain", {}) or {}
    snow = data.get("snow", {}) or {}
    rain_mm = float(rain.get("1h", rain.get("3h", 0) or 0))
    snow_mm = float(snow.get("1h", snow.get("3h", 0) or 0))
    return {
        "ok": True,
        "city": data.get("name"),
        "temperature_c": main.get("temp"),
        "feels_like_c": main.get("feels_like"),
        "humidity": main.get("humidity"),
        "rain_last_hour_mm": rain_mm,
        "snow_last_hour_mm": snow_mm,
        "description": (data.get("weather") or [{}])[0].get("description"),
        "raw": data,
    }


def fetch_weather_by_coords(lat: float, lon: float) -> dict[str, Any]:
    cfg = get_config()
    key = cfg.OPENWEATHER_API_KEY
    if not key:
        return {"ok": False, "error": "OPENWEATHER_API_KEY not configured"}
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": key,
        "units": cfg.OPENWEATHER_UNITS,
    }
    try:
        r = requests.get(url, params=params, timeout=10)
        r.raise_for_status()
        data = r.json()
    except Exception as e:
        return {"ok": False, "error": str(e)}
    main = data.get("main", {})
    rain = data.get("rain", {}) or {}
    rain_mm = float(rain.get("1h", rain.get("3h", 0) or 0))
    return {
        "ok": True,
        "temperature_c": main.get("temp"),
        "rain_last_hour_mm": rain_mm,
        "description": (data.get("weather") or [{}])[0].get("description"),
    }
