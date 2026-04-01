from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class PredictRequest(BaseModel):
    state: str = Field(..., min_length=1)
    crop: str = Field(..., min_length=1)
    season: str = Field(..., min_length=1)
    rainfall: float = Field(ge=0, le=15000)
    temperature: float = Field(ge=-10, le=55)
    area: float = Field(gt=0, le=1_000_000)
    soil: str | None = None
    region: str | None = None
    user_id: str | None = Field(
        default=None,
        description="If set, prediction is persisted when MongoDB is available",
    )
    voice_text: str | None = Field(
        default=None,
        description="Optional transcript from client-side speech-to-text",
    )
    include_shap_plot: bool = Field(
        default=False,
        description="If true, include base64 PNG of SHAP bar chart (larger payload).",
    )
    weather_source: str | None = Field(
        default=None,
        max_length=120,
        description="Optional client label for weather data provenance (e.g. Open-Meteo).",
    )
    soil_source: str | None = Field(
        default=None,
        max_length=120,
        description="Optional client label for soil data provenance (e.g. ISRIC SoilGrids).",
    )

    @field_validator("state", "crop", "season", mode="before")
    @classmethod
    def strip_str(cls, v: Any) -> str:
        if isinstance(v, str):
            return v.strip()
        return str(v)


class RecommendRequest(BaseModel):
    rainfall: float = Field(ge=0, le=15000)
    temperature: float = Field(ge=-10, le=55)
    soil: str | None = None
    region: str = Field(default="unknown")
    season: str | None = Field(
        default=None,
        description="Optional Kharif/Rabi/Zaid — improves crop rules when set.",
    )

    @field_validator("region", mode="before")
    @classmethod
    def _region_default(cls, v: Any) -> str:
        if v is None or (isinstance(v, str) and not str(v).strip()):
            return "unknown"
        return str(v).strip()

    @field_validator("season", mode="before")
    @classmethod
    def _season_strip(cls, v: Any) -> str | None:
        if v is None:
            return None
        s = str(v).strip()
        return s if s else None


class ProfitRequest(BaseModel):
    crop: str
    yield_per_ha: float = Field(alias="yield", gt=0)
    area: float = Field(gt=0)

    model_config = {"populate_by_name": True}


class ForecastRequest(BaseModel):
    periods: int = Field(default=6, ge=1, le=36)
    history: list[dict[str, Any]] | None = None


class ExplainRequest(BaseModel):
    state: str
    crop: str
    season: str
    rainfall: float
    temperature: float
    area: float


class RiskRequest(BaseModel):
    rainfall: float = Field(ge=0, le=15000)


class ChatbotRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    context: dict[str, Any] | None = None


class RAGRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class HistorySaveRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    input: dict[str, Any]
    prediction: dict[str, Any]
    meta: dict[str, Any] | None = None


class HistoryListRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    limit: int = Field(default=50, ge=1, le=200)


class HistoryAction(BaseModel):
    action: Literal["save", "list"]
    user_id: str = Field(..., min_length=1)
    input: dict[str, Any] | None = None
    prediction: dict[str, Any] | None = None
    meta: dict[str, Any] | None = None
    limit: int = Field(default=50, ge=1, le=200)
