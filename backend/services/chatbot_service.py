"""Chatbot: optional OpenAI, else agriculture rule-based fallback."""

from __future__ import annotations

import logging
import re
from typing import Any

from config import get_config

logger = logging.getLogger(__name__)

AG_KEYWORDS = re.compile(
    r"\b(crop|yield|rain|irrigation|soil|fertilizer|kharif|rabi|farm|pest|harvest|"
    r"agriculture|wheat|rice|maize|cotton|sugarcane|season|weather)\b",
    re.I,
)


def _rule_based_reply(text: str) -> str:
    t = text.lower().strip()
    if "water" in t or "irrigation" in t or "rain" in t:
        return (
            "For water management: align irrigation with crop stage and soil moisture. "
            "In low-rainfall windows, prefer drip or sprinkler efficiency and mulch to reduce evaporation."
        )
    if "fertilizer" in t or "nutrient" in t or "npk" in t:
        return (
            "Balanced nutrition matters: start from soil test results, split N applications for cereals, "
            "and monitor micronutrients where deficiencies are common in your region."
        )
    if "pest" in t or "disease" in t:
        return (
            "Integrated pest management combines scouting, rotation, and targeted chemistry. "
            "Prioritize resistant varieties and correct sowing dates to reduce pressure."
        )
    if "yield" in t or "production" in t:
        return (
            "Yield is driven by rainfall distribution, temperature stress, and input timing. "
            "Use our prediction API with your district parameters for a quantitative baseline."
        )
    return (
        "I can help with agronomy, weather-linked risk, and crop planning. "
        "Try asking about irrigation scheduling, fertilizer strategy, or seasonal crop choice."
    )


def _openai_reply(text: str) -> str | None:
    cfg = get_config()
    key = cfg.OPENAI_API_KEY
    if not key:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=key)
        r = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are AgriMind, an expert agricultural assistant. "
                        "Give concise, practical, region-aware guidance. "
                        "If unsure, ask clarifying questions."
                    ),
                },
                {"role": "user", "content": text},
            ],
            max_tokens=400,
            temperature=0.4,
        )
        return r.choices[0].message.content
    except Exception as e:
        logger.warning("OpenAI chat failed: %s", e)
        return None


def respond(query: str, context: dict[str, Any] | None = None) -> dict[str, Any]:
    q = query.strip()
    is_ag = bool(AG_KEYWORDS.search(q))
    if not is_ag:
        return {
            "reply": "I specialize in agriculture and farming decisions. "
            "Ask me about crops, irrigation, nutrients, or risk.",
            "source": "rule_guard",
            "agriculture_related": False,
        }

    llm = _openai_reply(q)
    if llm:
        return {
            "reply": llm,
            "source": "openai",
            "agriculture_related": True,
        },
    return {
        "reply": _rule_based_reply(q),
        "source": "rules",
        "agriculture_related": True,
    }
