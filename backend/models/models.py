import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Float, Integer, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.database import Base


class Load(Base):
    __tablename__ = "loads"

    load_id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4())[:8].upper())
    origin: Mapped[str] = mapped_column(String(200), nullable=False)
    destination: Mapped[str] = mapped_column(String(200), nullable=False)
    pickup_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    delivery_datetime: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    equipment_type: Mapped[str] = mapped_column(String(50), nullable=False)
    loadboard_rate: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True, default="")
    weight: Mapped[int] = mapped_column(Integer, nullable=False)
    commodity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    num_of_pieces: Mapped[int] = mapped_column(Integer, nullable=False)
    miles: Mapped[int] = mapped_column(Integer, nullable=False)
    dimensions: Mapped[str] = mapped_column(String(100), nullable=True, default="")


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    call_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    mc_number: Mapped[str] = mapped_column(String(20), nullable=False)
    carrier_name: Mapped[str] = mapped_column(String(200), nullable=False)
    load_id: Mapped[str] = mapped_column(String(50), nullable=True)
    initial_rate: Mapped[float] = mapped_column(Float, nullable=False)
    final_agreed_rate: Mapped[float] = mapped_column(Float, nullable=True)
    num_negotiations: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    outcome: Mapped[str] = mapped_column(String(30), nullable=False)
    sentiment: Mapped[str] = mapped_column(String(20), nullable=False)
    call_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[str] = mapped_column(Text, nullable=True, default="")
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
