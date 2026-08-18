from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models.printer import Printer, PrinterReading
from app.schemas.printer import PrinterCreate, PrinterUpdate, PrinterResponse, PrinterReadingCreate
from typing import List

router = APIRouter(prefix="/printers", tags=["printers"])


@router.get("", response_model=List[PrinterResponse])
def list_printers(session: Session = Depends(get_session)):
    printers = session.exec(select(Printer)).all()
    return printers


@router.get("/{printer_id}", response_model=PrinterResponse)
def get_printer(printer_id: int, session: Session = Depends(get_session)):
    printer = session.get(Printer, printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")
    return printer


@router.post("", response_model=PrinterResponse)
def create_printer(printer_data: PrinterCreate, session: Session = Depends(get_session)):
    existing = session.exec(select(Printer).where(Printer.ip == printer_data.ip)).first()
    if existing:
        raise HTTPException(status_code=400, detail="IP já existe")

    printer = Printer(**printer_data.model_dump())
    session.add(printer)
    session.commit()
    session.refresh(printer)
    return printer


@router.patch("/{printer_id}", response_model=PrinterResponse)
def update_printer(printer_id: int, printer_data: PrinterUpdate, session: Session = Depends(get_session)):
    printer = session.get(Printer, printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")

    update_data = printer_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(printer, field, value)

    session.add(printer)
    session.commit()
    session.refresh(printer)
    return printer


@router.get("/{printer_id}/readings")
def get_printer_readings(printer_id: int, limit: int = 100, session: Session = Depends(get_session)):
    readings = session.exec(
        select(PrinterReading)
        .where(PrinterReading.printer_id == printer_id)
        .order_by(PrinterReading.timestamp.desc())
        .limit(limit)
    ).all()
    return readings


@router.post("/{printer_id}/readings")
def create_printer_reading(printer_id: int, reading_data: PrinterReadingCreate, session: Session = Depends(get_session)):
    printer = session.get(Printer, printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Impressora não encontrada")

    reading = PrinterReading(
        printer_id=printer_id,
        status=reading_data.status,
        page_count=reading_data.page_count,
        toner_k=reading_data.toner_k,
        toner_c=reading_data.toner_c,
        toner_m=reading_data.toner_m,
        toner_y=reading_data.toner_y,
    )
    session.add(reading)
    session.commit()
    session.refresh(reading)
    return reading
