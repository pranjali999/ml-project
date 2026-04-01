"""Map Indian state/UT names from APY, user input, and common aliases to one canonical key."""

from __future__ import annotations

import re

# Lowercase keys. Values match `data/india_state_climate_normals.csv` state_key style.
_STATE_ALIASES: dict[str, str] = {
    # Odisha
    "orissa": "odisha",
    # Ladakh (APY typo)
    "laddak": "ladakh",
    # Dadra & Nagar Haveli (APY / legal name variants)
    "the dadra and nagar haveli": "dadra and nagar haveli",
    "dadra and nagar haveli and daman and diu": "dadra and nagar haveli",
    "dnh and dd": "dadra and nagar haveli",
    "daman & diu": "daman and diu",
    # Delhi
    "nct of delhi": "delhi",
    "national capital territory of delhi": "delhi",
    "new delhi": "delhi",
    # Puducherry
    "pondicherry": "puducherry",
    "pondichery": "puducherry",
    # Andaman
    "andaman and nicobar islands": "andaman and nicobar island",
    "andaman & nicobar": "andaman and nicobar island",
    "a & n islands": "andaman and nicobar island",
    # Concatenated / legacy spellings (unambiguous)
    "uttarpradesh": "uttar pradesh",
    "madhyapradesh": "madhya pradesh",
    "westbengal": "west bengal",
    "tamilnadu": "tamil nadu",
    "j&k": "jammu and kashmir",
    "jammu & kashmir": "jammu and kashmir",
    "uttaranchal": "uttarakhand",
}


def canonicalize_state(name: str | None) -> str:
    """
    Normalize user or dataset state string to a single lowercase key used in training
    and climate normals. Unknown strings are returned cleaned (lower, single spaces).
    """
    if name is None:
        return "unknown"
    raw = str(name).strip()
    if not raw:
        return "unknown"
    s = re.sub(r"\s+", " ", raw.lower())
    return _STATE_ALIASES.get(s, s)
