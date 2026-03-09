from sqlalchemy import select, func, case, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import Optional

from backend.models.models import Load, Call
from backend.schemas.schemas import (
    CallCreate, CallOut, LoadOut, MetricsResponse,
    CallsPerDay, TopLane,
)


# ── Loads ─────────────────────────────────────────────────────────

async def get_loads(
    db: AsyncSession,
    origin: Optional[str] = None,
    destination: Optional[str] = None,
    equipment_type: Optional[str] = None,
    max_results: int = 3,
) -> list[LoadOut]:
    query = select(Load)
    if origin:
        query = query.where(Load.origin.ilike(f"%{origin}%"))
    if destination:
        query = query.where(Load.destination.ilike(f"%{destination}%"))
    if equipment_type:
        query = query.where(Load.equipment_type.ilike(f"%{equipment_type}%"))
    query = query.limit(max_results)

    result = await db.execute(query)
    rows = result.scalars().all()
    return [LoadOut.model_validate(r) for r in rows]


async def get_load_by_id(db: AsyncSession, load_id: str) -> Optional[LoadOut]:
    result = await db.execute(select(Load).where(Load.load_id == load_id))
    row = result.scalar_one_or_none()
    return LoadOut.model_validate(row) if row else None


# ── Calls ─────────────────────────────────────────────────────────

async def create_call(db: AsyncSession, call_data: CallCreate) -> CallOut:
    # Auto-generate call_id: CALL-YYYYMMDD-XXX
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"CALL-{today}-"
    result = await db.execute(
        select(func.count()).select_from(Call).where(Call.call_id.like(f"{prefix}%"))
    )
    count = result.scalar() or 0
    call_id = f"{prefix}{count + 1:03d}"

    call = Call(call_id=call_id, **call_data.model_dump())
    db.add(call)
    await db.commit()
    await db.refresh(call)
    return CallOut.model_validate(call)


async def get_calls(
    db: AsyncSession,
    outcome: Optional[str] = None,
    sentiment: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
) -> list[CallOut]:
    query = select(Call).order_by(Call.timestamp.desc())
    if outcome:
        query = query.where(Call.outcome == outcome)
    if sentiment:
        query = query.where(Call.sentiment == sentiment)
    if date_from:
        query = query.where(Call.timestamp >= date_from)
    if date_to:
        query = query.where(Call.timestamp <= date_to)

    result = await db.execute(query)
    rows = result.scalars().all()
    return [CallOut.model_validate(r) for r in rows]


# ── Metrics ───────────────────────────────────────────────────────

async def get_metrics(db: AsyncSession) -> MetricsResponse:
    # Total calls
    total_result = await db.execute(select(func.count(Call.id)))
    total_calls = total_result.scalar() or 0

    if total_calls == 0:
        return MetricsResponse(
            total_calls=0,
            booked_count=0,
            booking_rate=0.0,
            avg_negotiation_rounds=0.0,
            avg_rate_delta_pct=0.0,
            sentiment_breakdown={"positive": 0, "neutral": 0, "negative": 0},
            outcome_breakdown={},
            calls_per_day=[],
            avg_call_duration_seconds=0.0,
            top_lanes=[],
        )

    # Booked count
    booked_result = await db.execute(
        select(func.count(Call.id)).where(Call.outcome == "booked")
    )
    booked_count = booked_result.scalar() or 0
    booking_rate = round((booked_count / total_calls) * 100, 1) if total_calls else 0.0

    # Average negotiation rounds
    avg_neg_result = await db.execute(select(func.avg(Call.num_negotiations)))
    avg_negotiation_rounds = round(avg_neg_result.scalar() or 0, 1)

    # Average rate delta % (for booked calls with both rates)
    booked_calls_result = await db.execute(
        select(Call).where(
            Call.outcome == "booked",
            Call.final_agreed_rate.isnot(None),
            Call.initial_rate > 0,
        )
    )
    booked_calls = booked_calls_result.scalars().all()
    if booked_calls:
        deltas = []
        for c in booked_calls:
            if c.initial_rate and c.final_agreed_rate:
                delta_pct = ((c.final_agreed_rate - c.initial_rate) / c.initial_rate) * 100
                deltas.append(delta_pct)
        avg_rate_delta_pct = round(sum(deltas) / len(deltas), 1) if deltas else 0.0
    else:
        avg_rate_delta_pct = 0.0

    # Sentiment breakdown
    sent_result = await db.execute(
        select(Call.sentiment, func.count(Call.id)).group_by(Call.sentiment)
    )
    sentiment_breakdown = {"positive": 0, "neutral": 0, "negative": 0}
    for row in sent_result:
        sentiment_breakdown[row[0]] = row[1]

    # Outcome breakdown
    outcome_result = await db.execute(
        select(Call.outcome, func.count(Call.id)).group_by(Call.outcome)
    )
    outcome_breakdown = {row[0]: row[1] for row in outcome_result}

    # Calls per day
    day_col = cast(Call.timestamp, Date)
    cpd_result = await db.execute(
        select(
            day_col.label("day"),
            func.count(Call.id),
        )
        .group_by(day_col)
        .order_by(day_col)
    )
    calls_per_day = [CallsPerDay(date=str(row[0]), count=row[1]) for row in cpd_result]

    # Avg call duration
    avg_dur_result = await db.execute(select(func.avg(Call.call_duration_seconds)))
    avg_call_duration_seconds = round(avg_dur_result.scalar() or 0, 1)

    # Top lanes (from calls joined with loads)
    top_lanes_result = await db.execute(
        select(Load.origin, Load.destination, func.count(Call.id).label("cnt"))
        .join(Load, Call.load_id == Load.load_id)
        .group_by(Load.origin, Load.destination)
        .order_by(func.count(Call.id).desc())
        .limit(5)
    )
    top_lanes = [TopLane(origin=r[0], destination=r[1], count=r[2]) for r in top_lanes_result]

    return MetricsResponse(
        total_calls=total_calls,
        booked_count=booked_count,
        booking_rate=booking_rate,
        avg_negotiation_rounds=avg_negotiation_rounds,
        avg_rate_delta_pct=avg_rate_delta_pct,
        sentiment_breakdown=sentiment_breakdown,
        outcome_breakdown=outcome_breakdown,
        calls_per_day=calls_per_day,
        avg_call_duration_seconds=avg_call_duration_seconds,
        top_lanes=top_lanes,
    )
