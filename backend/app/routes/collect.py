"""
Coleta manual de impressoras (Etapa 6).

Sem agendamento: cada chamada dispara uma unica coleta e grava um
PrinterReading. O modo "mock" so funciona quando settings.allow_mock_collect
estiver ligado, para que dados simulados nunca entrem no banco em producao.
"""
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlmodel import Session

from app.config import settings
from app.database import get_session
from app.services.printer_collector import PrinterCollector
from app.services.snmp_mock import SCENARIOS

router = APIRouter(prefix="/collect", tags=["collect"])


class CollectRequest(BaseModel):
    mode: Literal["real", "mock"] = Field(
        default="real",
        description="'real' consulta a impressora via SNMP; 'mock' usa um cenario simulado.",
    )
    scenario: str = Field(
        default="online_mono",
        description="Cenario simulado; ignorado quando mode='real'.",
    )
    is_color: bool | None = Field(
        default=None,
        description="Forca colorida/mono. Omitido, deduz do modelo/nome da impressora.",
    )


class CollectResponse(BaseModel):
    success: bool
    reading_id: int | None = None
    printer_id: int | None = None
    printer_name: str | None = None
    ip: str | None = None
    mode: str | None = None
    is_color: bool | None = None
    status: str | None = None
    page_count: int | None = None
    toner_count: int = 0
    toners: dict[str, int] = {}
    reachable: bool | None = None
    snmp_responded: bool | None = None
    uptime: str | None = None
    error: str | None = None
    timestamp: str | None = None


@router.post("/printers/{printer_id}", response_model=CollectResponse)
def collect_printer(
    printer_id: int,
    request: CollectRequest,
    session: Session = Depends(get_session),
):
    """Coleta uma impressora e persiste a leitura."""
    if request.mode == "mock":
        if not settings.allow_mock_collect:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Coleta simulada desabilitada. Defina ALLOW_MOCK_COLLECT=true "
                    "no .env para usar mode='mock' (apenas em desenvolvimento)."
                ),
            )
        if request.scenario not in SCENARIOS:
            raise HTTPException(
                status_code=400,
                detail=f"Cenario invalido: {request.scenario!r}. Validos: {', '.join(SCENARIOS)}",
            )

    collector = PrinterCollector(mode=request.mode, mock_scenario=request.scenario)
    result = collector.collect_and_save(printer_id, session, is_color=request.is_color)

    if not result["success"]:
        # Impressora inexistente e 404; o resto e falha de processamento.
        status_code = 404 if "nao encontrada" in result["error"] else 500
        raise HTTPException(status_code=status_code, detail=result["error"])

    return CollectResponse(**result)


@router.get("/scenarios")
def list_scenarios():
    """Cenarios simulados disponiveis e se o modo mock esta habilitado."""
    return {
        "mock_enabled": settings.allow_mock_collect,
        "scenarios": PrinterCollector.list_mock_scenarios(),
        "usage": "POST /api/collect/printers/{id} com {\"mode\":\"mock\",\"scenario\":\"<nome>\"}",
    }
