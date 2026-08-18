from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TonerLevel(BaseModel):
    color: str
    label: str
    percent: int


class PrinterCreate(BaseModel):
    ip: str
    name: str
    model: str
    department: str


class PrinterUpdate(BaseModel):
    name: Optional[str] = None
    model: Optional[str] = None
    department: Optional[str] = None


class PrinterResponse(BaseModel):
    id: int
    ip: str
    name: str
    model: str
    department: str
    created_at: datetime

    class Config:
        from_attributes = True


class PrinterWithStatus(PrinterResponse):
    status: str
    page_count: int
    toner: Optional[List[TonerLevel]] = None
    last_seen: str


class PrinterReadingCreate(BaseModel):
    status: str
    page_count: int
    toner_k: int | None = None
    toner_c: int | None = None
    toner_m: int | None = None
    toner_y: int | None = None


class PrinterReadingResponse(BaseModel):
    id: int
    printer_id: int
    status: str
    page_count: int
    toner_k: int | None = None
    toner_c: int | None = None
    toner_m: int | None = None
    toner_y: int | None = None
    timestamp: datetime

    class Config:
        from_attributes = True
