from datetime import datetime, timezone
from typing import Optional, Literal, Any
from pydantic import BaseModel, Field, field_validator


# ── Carrier verification ──────────────────────────────────────────
class VerifyCarrierRequest(BaseModel):
    mc_number: str = Field(..., description="Motor Carrier number (digits only or with MC- prefix)")


class VerifyCarrierResponse(BaseModel):
    eligible: bool
    carrier_name: str
    dot_number: str
    status: str
    reason: str


# ── Loads ─────────────────────────────────────────────────────────
class SearchLoadsRequest(BaseModel):
    origin: Optional[str] = Field(None, description="Filter by origin (fuzzy)")
    destination: Optional[str] = Field(None, description="Filter by destination (fuzzy)")
    equipment_type: Optional[str] = Field(None, description="Filter by equipment type (exact)")
    max_results: int = Field(1, ge=1, le=50, description="Max results to return")


class LoadOut(BaseModel):
    load_id: str
    origin: str
    destination: str
    pickup_datetime: datetime
    delivery_datetime: datetime
    equipment_type: str
    loadboard_rate: float
    notes: Optional[str] = ""
    weight: int
    commodity_type: str
    num_of_pieces: int
    miles: int
    dimensions: Optional[str] = ""

    class Config:
        from_attributes = True


class SearchLoadsResponse(BaseModel):
    count: int
    loads: list[LoadOut]


# ── Calls ─────────────────────────────────────────────────────────
OutcomeType = Literal[
    "booked", "no_load_found", "price_rejected",
    "carrier_ineligible", "hung_up", "transferred"
]
SentimentType = Literal["positive", "neutral", "negative"]


class CallCreate(BaseModel):
    call_id: str
    mc_number: str
    carrier_name: str = "Unknown"
    load_id: Optional[str] = None
    initial_rate: float = 0.0
    final_agreed_rate: Optional[float] = None
    num_negotiations: int = 0
    outcome: OutcomeType
    sentiment: SentimentType
    call_duration_seconds: int = 0
    notes: Optional[str] = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("carrier_name", mode="before")
    @classmethod
    def _parse_carrier_name(cls, v: Any) -> str:
        if v is None or v == "" or v == "null":
            return "Unknown"
        return str(v)

    @field_validator("load_id", mode="before")
    @classmethod
    def _parse_optional_str(cls, v: Any) -> Optional[str]:
        if v is None or v == "" or v == "null":
            return None
        return str(v)

    @field_validator("initial_rate", mode="before")
    @classmethod
    def _parse_initial_rate(cls, v: Any) -> float:
        if v is None or v == "" or v == "null":
            return 0.0
        return float(v)

    @field_validator("final_agreed_rate", mode="before")
    @classmethod
    def _parse_final_rate(cls, v: Any) -> Optional[float]:
        if v is None or v == "" or v == "null":
            return None
        return float(v)

    @field_validator("num_negotiations", "call_duration_seconds", mode="before")
    @classmethod
    def _parse_int(cls, v: Any) -> int:
        if v is None or v == "" or v == "null":
            return 0
        return int(v)


class CallOut(BaseModel):
    call_id: str
    mc_number: str
    carrier_name: str
    load_id: Optional[str] = None
    initial_rate: float
    final_agreed_rate: Optional[float] = None
    num_negotiations: int
    outcome: str
    sentiment: str
    call_duration_seconds: int
    notes: Optional[str] = ""
    timestamp: datetime

    class Config:
        from_attributes = True


# ── Metrics ───────────────────────────────────────────────────────
class CallsPerDay(BaseModel):
    date: str
    count: int


class TopLane(BaseModel):
    origin: str
    destination: str
    count: int


# ── Negotiation ───────────────────────────────────────────────────
class EvaluateOfferRequest(BaseModel):
    load_id: str = Field(..., description="ID of the load being negotiated")
    carrier_rate: float = Field(..., gt=0, description="Rate proposed by the carrier")
    round: int = Field(..., ge=1, le=4, description="Current negotiation round (1-3, 4 = reject)")


class EvaluateOfferResponse(BaseModel):
    accept: bool
    counter_rate: Optional[float] = None
    max_rate: float
    loadboard_rate: float
    round: int
    message: str


class MetricsResponse(BaseModel):
    total_calls: int
    booked_count: int
    booking_rate: float
    avg_negotiation_rounds: float
    avg_rate_delta_pct: float
    sentiment_breakdown: dict[str, int]
    outcome_breakdown: dict[str, int]
    calls_per_day: list[CallsPerDay]
    avg_call_duration_seconds: float = 0.0
    top_lanes: list[TopLane] = []
