"""Request validation helpers."""

from typing import Any


class ValidationError(Exception):
    def __init__(self, message: str, field: str | None = None):
        self.message = message
        self.field = field
        super().__init__(message)


def require_keys(data: dict, keys: list[str], path: str = "body") -> None:
    missing = [k for k in keys if k not in data or data[k] is None]
    if missing:
        raise ValidationError(f"Missing required fields: {missing}", path)


def positive_number(value: Any, name: str) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError) as e:
        raise ValidationError(f"{name} must be a number") from e
    if v <= 0:
        raise ValidationError(f"{name} must be positive")
    return v


def non_negative_number(value: Any, name: str) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError) as e:
        raise ValidationError(f"{name} must be a number") from e
    if v < 0:
        raise ValidationError(f"{name} must be non-negative")
    return v
