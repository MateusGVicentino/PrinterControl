"""
Orquestrador da coleta de impressoras.

Separa as tres responsabilidades da Etapa 6:
  1. comunicacao SNMP        -> app/services/snmp.py (real) ou snmp_mock.py (teste)
  2. processamento dos dados -> aqui
  3. persistencia            -> PrinterReading, via a mesma tabela ja existente
"""
import re

from sqlmodel import Session

from app.config import settings
from app.models.printer import Printer, PrinterReading
from app.services.snmp import SNMPClient, SNMPResult
from app.services.snmp_mock import MockSNMPClient

# Impressoras coloridas (PS1: $modelo -match 'color|M6530' -or $p.Name -match 'color')
COLOR_RE = re.compile(r"color|M6530", re.I)

# Etiquetadoras/portateis: nao expoem Printer-MIB, o PS1 pula o SNMP nelas
# (PS1: $modelo -notmatch 'TT042|Honeywell' -and $p.Name -notmatch 'TT042|Honeywell|Etiqueta|Elgin')
LABEL_RE = re.compile(r"TT042|Honeywell|Etiqueta|Zebra|Argox|Sewoo|RP4f", re.I)


class PrinterCollector:
    """Coleta uma impressora e grava o resultado como PrinterReading."""

    def __init__(self, mode: str = "real", mock_scenario: str = "online_mono"):
        """
        Args:
            mode: "real" (SNMP de verdade) ou "mock" (cenario simulado)
            mock_scenario: cenario usado quando mode="mock"
        """
        self.mode = mode
        if mode == "mock":
            self.client = MockSNMPClient(scenario=mock_scenario)
        else:
            self.client = SNMPClient(
                community=settings.snmp_community,
                timeout=settings.snmp_timeout,
            )

    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def is_color_printer(printer: Printer) -> bool:
        """Deduz se a impressora e colorida a partir do modelo/nome (regra do PS1)."""
        return bool(COLOR_RE.search(printer.model or "") or COLOR_RE.search(printer.name or ""))

    @staticmethod
    def is_label_printer(printer: Printer) -> bool:
        """Etiquetadora/portatil: sem Printer-MIB, o PS1 nem consulta SNMP."""
        return bool(LABEL_RE.search(printer.model or "") or LABEL_RE.search(printer.name or ""))

    # ─────────────────────────────────────────────────────────────────────
    def collect_and_save(
        self, printer_id: int, session: Session, is_color: bool | None = None
    ) -> dict:
        """
        Coleta uma impressora e persiste a leitura.

        Args:
            printer_id: id da impressora no banco
            session: sessao SQLModel
            is_color: força o modo colorido; None deduz do modelo/nome

        Returns:
            dict com o resultado — nunca levanta excecao de rede, para que a
            falha de uma impressora nao interrompa a coleta das demais.
        """
        printer = session.get(Printer, printer_id)
        if not printer:
            return {"success": False, "error": f"Impressora {printer_id} nao encontrada"}

        if is_color is None:
            is_color = self.is_color_printer(printer)

        try:
            if self.mode == "real" and self.is_label_printer(printer):
                # PS1 pula SNMP nesses modelos; registra so a conectividade.
                result = SNMPResult(
                    status="online" if SNMPClient()._ping(printer.ip) else "offline",
                    reachable=True,
                    snmp_responded=False,
                    error="etiquetadora/portatil: SNMP nao consultado",
                )
                result.reachable = result.status == "online"
            else:
                result = self.client.collect(printer.ip, is_color=is_color)

            reading = self._result_to_reading(printer_id, result)
            session.add(reading)
            session.commit()
            session.refresh(reading)

            return {
                "success": True,
                "reading_id": reading.id,
                "printer_id": printer_id,
                "printer_name": printer.name,
                "ip": printer.ip,
                "mode": self.mode,
                "is_color": is_color,
                "status": result.status,
                "page_count": result.page_count,
                "toner_count": len(result.toners),
                "toners": {t.color: t.percent for t in result.toners},
                "reachable": result.reachable,
                "snmp_responded": result.snmp_responded,
                "uptime": result.uptime,
                "error": result.error,
                "timestamp": reading.timestamp.isoformat(),
            }

        except Exception as exc:
            session.rollback()
            return {"success": False, "error": f"{type(exc).__name__}: {exc}"}

    @staticmethod
    def _result_to_reading(printer_id: int, result: SNMPResult) -> PrinterReading:
        """
        Converte SNMPResult em PrinterReading.

        Toner ausente vira NULL (a coluna e anulavel) — em impressora mono
        so toner_k e preenchido. page_count ausente vira 0, como no PS1
        (`pagesPrinted = if ($imp.PageCount) { ... } else { 0 }`).
        """
        levels = {t.color: t.percent for t in result.toners}
        return PrinterReading(
            printer_id=printer_id,
            status=result.status,
            page_count=result.page_count or 0,
            toner_k=levels.get("K"),
            toner_c=levels.get("C"),
            toner_m=levels.get("M"),
            toner_y=levels.get("Y"),
        )

    @staticmethod
    def list_mock_scenarios() -> list[str]:
        """Cenarios de teste disponiveis (fonte unica: snmp_mock.SCENARIOS)."""
        return MockSNMPClient.list_scenarios()
