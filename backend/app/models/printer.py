from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import datetime


class Printer(SQLModel, table=True):
    __tablename__ = "printers"

    id: int | None = Field(default=None, primary_key=True)
    ip: str = Field(unique=True, index=True)
    name: str
    model: str
    department: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PrinterReading(SQLModel, table=True):
    __tablename__ = "printer_readings"

    id: int | None = Field(default=None, primary_key=True)
    printer_id: int = Field(foreign_key="printers.id")
    status: str  # online, offline, atencao
    page_count: int
    toner_k: int | None = None
    toner_c: int | None = None
    toner_m: int | None = None
    toner_y: int | None = None
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)


class PrinterMonthly(SQLModel, table=True):
    __tablename__ = "printer_monthly"

    id: int | None = Field(default=None, primary_key=True)
    printer_id: int = Field(foreign_key="printers.id")
    month: str  # "Jan", "Fev", etc
    pages_printed: int
    month_start: datetime
    month_end: datetime
