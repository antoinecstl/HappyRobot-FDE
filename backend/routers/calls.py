from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime

from backend.database import get_db
from backend.schemas.schemas import CallCreate, CallOut, MetricsResponse
from backend.services.db_service import create_call, get_calls, get_metrics

router = APIRouter(tags=["calls"])


@router.post("/calls", response_model=CallOut, status_code=201)
async def record_call(body: CallCreate, db: AsyncSession = Depends(get_db)):
    return await create_call(db, body)


@router.get("/calls", response_model=list[CallOut])
async def list_calls(
    outcome: Optional[str] = Query(None),
    sentiment: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_calls(db, outcome, sentiment, date_from, date_to)


@router.get("/metrics", response_model=MetricsResponse)
async def metrics(db: AsyncSession = Depends(get_db)):
    return await get_metrics(db)
