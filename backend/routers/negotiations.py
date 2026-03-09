from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas.schemas import EvaluateOfferRequest, EvaluateOfferResponse
from backend.services.db_service import get_load_by_id

router = APIRouter(tags=["negotiations"])

# Negotiation thresholds (% above loadboard_rate)
ROUND_CAPS = {
    1: 0.05,  # +5%
    2: 0.08,  # +8%
    3: 0.10,  # +10% (hard cap)
}


@router.post("/negotiations/evaluate", response_model=EvaluateOfferResponse)
async def evaluate_offer(body: EvaluateOfferRequest, db: AsyncSession = Depends(get_db)):
    load = await get_load_by_id(db, body.load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    loadboard_rate = load.loadboard_rate
    cap_pct = ROUND_CAPS.get(body.round)

    # Round > 3 or carrier asks more than hard cap → reject
    if cap_pct is None or body.carrier_rate > loadboard_rate * (1 + ROUND_CAPS[3]):
        return EvaluateOfferResponse(
            accept=False,
            counter_rate=None,
            max_rate=round(loadboard_rate * (1 + ROUND_CAPS[3]), 2),
            loadboard_rate=loadboard_rate,
            round=body.round,
            message=f"Rate ${body.carrier_rate:.2f} exceeds our maximum of ${loadboard_rate * (1 + ROUND_CAPS[3]):.2f}. We cannot go higher on this load.",
        )

    max_for_round = round(loadboard_rate * (1 + cap_pct), 2)

    # Carrier rate is at or below what we can offer this round → accept
    if body.carrier_rate <= max_for_round:
        return EvaluateOfferResponse(
            accept=True,
            counter_rate=body.carrier_rate,
            max_rate=max_for_round,
            loadboard_rate=loadboard_rate,
            round=body.round,
            message=f"Rate ${body.carrier_rate:.2f} is acceptable. Proceed with booking.",
        )

    # Carrier asks more than this round allows → counter with round max
    return EvaluateOfferResponse(
        accept=False,
        counter_rate=max_for_round,
        max_rate=max_for_round,
        loadboard_rate=loadboard_rate,
        round=body.round,
        message=f"We can offer up to ${max_for_round:.2f} for this round. Can you work with that?",
    )
