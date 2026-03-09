from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_db
from backend.schemas.schemas import VerifyCarrierRequest, VerifyCarrierResponse
from backend.services.fmcsa_service import verify_carrier

router = APIRouter(tags=["carrier"])


@router.post("/verify-carrier", response_model=VerifyCarrierResponse)
async def verify_carrier_endpoint(body: VerifyCarrierRequest):
    return await verify_carrier(body.mc_number)
