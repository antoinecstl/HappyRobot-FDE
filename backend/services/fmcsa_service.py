import httpx
import re

from backend.config import settings
from backend.schemas.schemas import VerifyCarrierResponse


FMCSA_BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services/carriers/docket-number"


async def verify_carrier(mc_number: str) -> VerifyCarrierResponse:
    """Call FMCSA API to verify a carrier by MC number."""
    # Strip non-numeric characters (handle MC-123456 or MC123456)
    clean_mc = re.sub(r"[^0-9]", "", mc_number)
    if not clean_mc:
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name="",
            dot_number="",
            status="INVALID",
            reason="Invalid MC number format",
        )

    url = f"{FMCSA_BASE_URL}/{clean_mc}?webKey={settings.FMCSA_API_KEY}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url)

        if resp.status_code == 404:
            return VerifyCarrierResponse(
                eligible=False,
                carrier_name="",
                dot_number="",
                status="NOT_FOUND",
                reason=f"No carrier found for MC-{clean_mc}",
            )

        resp.raise_for_status()
        data = resp.json()

        # FMCSA returns nested structures – handle both shapes
        carrier = None
        if "content" in data:
            content = data["content"]
            if isinstance(content, list) and len(content) > 0:
                carrier = content[0].get("carrier") or content[0]
            elif isinstance(content, dict):
                carrier = content.get("carrier") or content
        elif "carrier" in data:
            carrier = data["carrier"]

        if not carrier:
            return VerifyCarrierResponse(
                eligible=False,
                carrier_name="",
                dot_number="",
                status="NOT_FOUND",
                reason=f"No carrier data returned for MC-{clean_mc}",
            )

        carrier_name = carrier.get("legalName") or carrier.get("dbaName") or "Unknown"
        dot_number = str(carrier.get("dotNumber", ""))
        op_status = carrier.get("allowedToOperate", "")
        safety_rating = carrier.get("safetyRating", "") or ""

        # Check operating status
        # The allowedToOperate field or statusCode / carrierOperation.operatingStatus
        auth_status = carrier.get("carrierOperation", {}).get("operatingStatus", "") if isinstance(carrier.get("carrierOperation"), dict) else ""
        if not auth_status:
            auth_status = op_status

        is_authorized = str(auth_status).upper() in (
            "AUTHORIZED FOR PROPERTY",
            "A",
            "Y",
            "AUTHORIZED FOR HHG",
        )
        is_safe = str(safety_rating).upper() != "UNSATISFACTORY"

        eligible = is_authorized and is_safe
        status_str = str(auth_status) if auth_status else "UNKNOWN"

        if not is_authorized:
            reason = f"Carrier operating status is '{status_str}', not authorized for property."
        elif not is_safe:
            reason = f"Carrier has an Unsatisfactory safety rating."
        else:
            reason = "Carrier is eligible."

        return VerifyCarrierResponse(
            eligible=eligible,
            carrier_name=carrier_name,
            dot_number=dot_number,
            status=status_str,
            reason=reason,
        )

    except httpx.TimeoutException:
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name="",
            dot_number="",
            status="TIMEOUT",
            reason="FMCSA API request timed out. Please try again.",
        )
    except httpx.HTTPStatusError as e:
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name="",
            dot_number="",
            status="API_ERROR",
            reason=f"FMCSA API returned status {e.response.status_code}.",
        )
    except Exception as e:
        return VerifyCarrierResponse(
            eligible=False,
            carrier_name="",
            dot_number="",
            status="ERROR",
            reason=f"Error verifying carrier: {str(e)}",
        )
