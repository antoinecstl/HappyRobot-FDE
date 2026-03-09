"""Seed the database with realistic mock loads and call history."""

import asyncio
import random
from datetime import datetime, timedelta, timezone

from backend.database import engine, async_session, Base
from backend.models.models import Load, Call


LOADS_DATA = [
    {
        "load_id": "LD-1001",
        "origin": "Chicago, IL",
        "destination": "Atlanta, GA",
        "equipment_type": "Dry Van",
        "loadboard_rate": 2450.00,
        "weight": 38000,
        "commodity_type": "Consumer Electronics",
        "num_of_pieces": 24,
        "miles": 716,
        "dimensions": "48x40x48",
        "notes": "Dock delivery, appointment required",
    },
    {
        "load_id": "LD-1002",
        "origin": "Dallas, TX",
        "destination": "Los Angeles, CA",
        "equipment_type": "Reefer",
        "loadboard_rate": 3800.00,
        "weight": 42000,
        "commodity_type": "Frozen Foods",
        "num_of_pieces": 18,
        "miles": 1435,
        "dimensions": "48x40x60",
        "notes": "Temperature must maintain -10°F",
    },
    {
        "load_id": "LD-1003",
        "origin": "Newark, NJ",
        "destination": "Miami, FL",
        "equipment_type": "Dry Van",
        "loadboard_rate": 2800.00,
        "weight": 35000,
        "commodity_type": "Pharmaceutical Supplies",
        "num_of_pieces": 30,
        "miles": 1280,
        "dimensions": "48x40x48",
        "notes": "No double-stack, fragile cargo",
    },
    {
        "load_id": "LD-1004",
        "origin": "Houston, TX",
        "destination": "Memphis, TN",
        "equipment_type": "Flatbed",
        "loadboard_rate": 1850.00,
        "weight": 44000,
        "commodity_type": "Steel Coils",
        "num_of_pieces": 6,
        "miles": 586,
        "dimensions": "72x48x36",
        "notes": "Tarps and straps required",
    },
    {
        "load_id": "LD-1005",
        "origin": "Seattle, WA",
        "destination": "Phoenix, AZ",
        "equipment_type": "Reefer",
        "loadboard_rate": 3200.00,
        "weight": 39000,
        "commodity_type": "Fresh Produce",
        "num_of_pieces": 22,
        "miles": 1418,
        "dimensions": "48x40x52",
        "notes": "Temp 34°F, driver assist unload",
    },
    {
        "load_id": "LD-1006",
        "origin": "Denver, CO",
        "destination": "Kansas City, MO",
        "equipment_type": "Dry Van",
        "loadboard_rate": 1650.00,
        "weight": 28000,
        "commodity_type": "Auto Parts",
        "num_of_pieces": 40,
        "miles": 606,
        "dimensions": "48x40x40",
        "notes": "Floor-loaded, FIFO delivery",
    },
    {
        "load_id": "LD-1007",
        "origin": "Nashville, TN",
        "destination": "Charlotte, NC",
        "equipment_type": "Dry Van",
        "loadboard_rate": 1500.00,
        "weight": 32000,
        "commodity_type": "Furniture",
        "num_of_pieces": 14,
        "miles": 406,
        "dimensions": "96x48x72",
        "notes": "Liftgate delivery at receiver",
    },
    {
        "load_id": "LD-1008",
        "origin": "Detroit, MI",
        "destination": "Columbus, OH",
        "equipment_type": "Flatbed",
        "loadboard_rate": 1550.00,
        "weight": 46000,
        "commodity_type": "Machinery",
        "num_of_pieces": 3,
        "miles": 265,
        "dimensions": "120x60x48",
        "notes": "Oversize requires escort if >12ft wide",
    },
    {
        "load_id": "LD-1009",
        "origin": "Los Angeles, CA",
        "destination": "Salt Lake City, UT",
        "equipment_type": "Reefer",
        "loadboard_rate": 2900.00,
        "weight": 41000,
        "commodity_type": "Dairy Products",
        "num_of_pieces": 26,
        "miles": 688,
        "dimensions": "48x40x48",
        "notes": "Must maintain 36°F, 2-day transit",
    },
    {
        "load_id": "LD-1010",
        "origin": "Atlanta, GA",
        "destination": "Philadelphia, PA",
        "equipment_type": "Dry Van",
        "loadboard_rate": 2100.00,
        "weight": 34000,
        "commodity_type": "Beverages",
        "num_of_pieces": 20,
        "miles": 780,
        "dimensions": "48x40x48",
        "notes": "Heavy pallets, dock unload only",
    },
    {
        "load_id": "LD-1011",
        "origin": "Minneapolis, MN",
        "destination": "St. Louis, MO",
        "equipment_type": "Dry Van",
        "loadboard_rate": 1750.00,
        "weight": 30000,
        "commodity_type": "Paper Products",
        "num_of_pieces": 32,
        "miles": 559,
        "dimensions": "48x40x56",
        "notes": "Keep dry, no moisture exposure",
    },
    {
        "load_id": "LD-1012",
        "origin": "Portland, OR",
        "destination": "San Francisco, CA",
        "equipment_type": "Flatbed",
        "loadboard_rate": 2200.00,
        "weight": 43000,
        "commodity_type": "Lumber",
        "num_of_pieces": 8,
        "miles": 636,
        "dimensions": "144x48x48",
        "notes": "Bundles strapped, tarps provided",
    },
]


CARRIER_NAMES = [
    "Swift Logistics LLC",
    "Eagle Transport Inc",
    "Midwest Haulers Corp",
    "Pacific Coast Carriers",
    "Lone Star Freight",
    "Great Plains Trucking",
    "Atlas Heavy Haul",
    "Pinnacle Logistics",
    "Summit Transport Group",
    "Heritage Freight Lines",
    "Frontier Carriers Inc",
    "Iron Horse Transport",
]

OUTCOMES = ["booked", "no_load_found", "price_rejected", "carrier_ineligible", "hung_up", "transferred"]
SENTIMENTS = ["positive", "neutral", "negative"]


def generate_calls(loads: list[dict], num_calls: int = 35) -> list[dict]:
    """Generate realistic call history spanning the last 14 days."""
    calls = []
    now = datetime.now(timezone.utc)

    for i in range(num_calls):
        # Spread over last 14 days
        days_ago = random.randint(0, 13)
        hours_ago = random.randint(0, 23)
        ts = now - timedelta(days=days_ago, hours=hours_ago)

        # Weighted outcome distribution to look realistic
        outcome = random.choices(
            OUTCOMES,
            weights=[35, 15, 20, 10, 10, 10],
            k=1,
        )[0]

        # Match sentiment to outcome
        if outcome == "booked":
            sentiment = random.choices(SENTIMENTS, weights=[60, 30, 10], k=1)[0]
        elif outcome in ("price_rejected", "hung_up"):
            sentiment = random.choices(SENTIMENTS, weights=[10, 30, 60], k=1)[0]
        else:
            sentiment = random.choices(SENTIMENTS, weights=[20, 50, 30], k=1)[0]

        load = random.choice(loads)
        load_id = load["load_id"] if outcome in ("booked", "transferred", "price_rejected") else None

        initial_rate = round(load["loadboard_rate"] * random.uniform(0.85, 1.15), 2) if load_id else round(random.uniform(1500, 4000), 2)

        if outcome == "booked":
            # Agreed within 10% above loadboard rate
            final_agreed_rate = round(load["loadboard_rate"] * random.uniform(1.0, 1.10), 2)
            num_negotiations = random.randint(1, 3)
        elif outcome == "transferred":
            final_agreed_rate = round(load["loadboard_rate"] * random.uniform(1.0, 1.08), 2)
            num_negotiations = random.randint(1, 3)
        else:
            final_agreed_rate = None
            num_negotiations = random.randint(0, 3)

        call_duration = random.randint(45, 420)
        mc_number = f"MC-{random.randint(100000, 999999)}"
        carrier_name = random.choice(CARRIER_NAMES)

        notes_options = [
            "Carrier asked about detention pay policy.",
            "Driver available immediately.",
            "Carrier requested lumper fee reimbursement.",
            "Call dropped briefly, reconnected.",
            "Carrier mentioned they prefer Southeast lanes.",
            "Good rapport with dispatcher.",
            "Carrier expressed interest in future loads.",
            "Rate negotiation was firm.",
            "Carrier asked about fuel surcharge.",
            "Quick call, efficient communication.",
            "",
        ]

        calls.append({
            "call_id": f"CALL-{1000 + i}",
            "mc_number": mc_number,
            "carrier_name": carrier_name,
            "load_id": load_id,
            "initial_rate": initial_rate,
            "final_agreed_rate": final_agreed_rate,
            "num_negotiations": num_negotiations,
            "outcome": outcome,
            "sentiment": sentiment,
            "call_duration_seconds": call_duration,
            "notes": random.choice(notes_options),
            "timestamp": ts,
        })

    return calls


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    now = datetime.now(timezone.utc)

    async with async_session() as session:
        # Check if data already exists
        from sqlalchemy import select, func
        result = await session.execute(select(func.count()).select_from(Load))
        count = result.scalar()
        if count and count > 0:
            print(f"Database already seeded with {count} loads. Skipping.")
            return

        # Seed loads
        for ld in LOADS_DATA:
            pickup = now + timedelta(days=random.randint(1, 5), hours=random.randint(6, 18))
            delivery = pickup + timedelta(days=random.randint(1, 3), hours=random.randint(2, 8))
            load = Load(
                load_id=ld["load_id"],
                origin=ld["origin"],
                destination=ld["destination"],
                pickup_datetime=pickup,
                delivery_datetime=delivery,
                equipment_type=ld["equipment_type"],
                loadboard_rate=ld["loadboard_rate"],
                notes=ld["notes"],
                weight=ld["weight"],
                commodity_type=ld["commodity_type"],
                num_of_pieces=ld["num_of_pieces"],
                miles=ld["miles"],
                dimensions=ld["dimensions"],
            )
            session.add(load)

        # Seed calls
        calls_data = generate_calls(LOADS_DATA, num_calls=35)
        for cd in calls_data:
            call = Call(**cd)
            session.add(call)

        await session.commit()
        print(f"Seeded {len(LOADS_DATA)} loads and {len(calls_data)} calls.")


if __name__ == "__main__":
    asyncio.run(seed())
