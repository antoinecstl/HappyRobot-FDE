from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from backend.database import get_db
from backend.schemas.schemas import LoadOut, SearchLoadsRequest
from backend.services.db_service import get_loads, get_load_by_id

router = APIRouter(tags=["loads"])


@router.get("/loads", response_model=list[LoadOut])
async def list_loads(
    origin: Optional[str] = Query(None, description="Filter by origin (fuzzy)"),
    destination: Optional[str] = Query(None, description="Filter by destination (fuzzy)"),
    equipment_type: Optional[str] = Query(None, description="Filter by equipment type (exact)"),
    max_results: int = Query(3, ge=1, le=50, description="Max results to return"),
    db: AsyncSession = Depends(get_db),
):
    return await get_loads(db, origin, destination, equipment_type, max_results)


@router.post("/loads/search", response_model=LoadOut)
async def search_loads(
    body: SearchLoadsRequest,
    db: AsyncSession = Depends(get_db),
):
    loads = await get_loads(db, body.origin, body.destination, body.equipment_type, body.max_results)
    if not loads:
        raise HTTPException(status_code=404, detail="No loads found matching criteria")
    return loads[0]


@router.get("/loads/{load_id}", response_model=LoadOut)
async def get_single_load(load_id: str, db: AsyncSession = Depends(get_db)):
    load = await get_load_by_id(db, load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load
