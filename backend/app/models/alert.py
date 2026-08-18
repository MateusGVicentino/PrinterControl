from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Alert(SQLModel, table=True):
    __tablename__ = "alerts"

    id: int | None = Field(default=None, primary_key=True)
    printer_id: int = Field(foreign_key="printers.id")
    severity: str  # critical, warning, info
    message: str
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    resolved_at: datetime | None = None


class TonerHistory(SQLModel, table=True):
    __tablename__ = "toner_history"

    id: int | None = Field(default=None, primary_key=True)
    printer_id: int = Field(foreign_key="printers.id")
    color: str  # K, C, M, Y
    percent: int
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
