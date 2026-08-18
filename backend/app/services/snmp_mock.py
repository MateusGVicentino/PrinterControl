"""
Agente SNMP simulado — APENAS PARA TESTE LOCAL.

Existe porque a maquina de desenvolvimento ainda nao tem rota ate a rede das
impressoras. Devolve SNMPResult prontos, sem tocar na rede, para validar o
processamento e a persistencia enquanto o SNMP real nao pode ser exercitado.

NAO substitui o SNMPClient: e selecionado explicitamente por mode="mock" em
/api/collect, que so aceita esse modo quando settings.allow_mock_collect
estiver ligado.
"""
from app.services.snmp import SNMPResult, TonerInfo


def _toner(color: str, percent: int, index: int, maximum: int = 10000) -> TonerInfo:
    return TonerInfo(
        color=color,
        percent=percent,
        index=index,
        maximum=maximum,
        description=f"{color} Toner (simulado)",
    )


class MockSNMPScenarios:
    """Cenarios de teste. Cada metodo devolve um SNMPResult completo."""

    @staticmethod
    def online_mono() -> SNMPResult:
        """Monocromatica saudavel."""
        return SNMPResult(
            status="online",
            page_count=5000,
            toners=[_toner("K", 65, 1)],
            uptime="45d, 3h, 22m",
            reachable=True,
            snmp_responded=True,
        )

    @staticmethod
    def online_color() -> SNMPResult:
        """Colorida saudavel (4 toners, ordem C, M, Y, K)."""
        return SNMPResult(
            status="online",
            page_count=3500,
            toners=[
                _toner("C", 58, 2),
                _toner("M", 61, 3),
                _toner("Y", 55, 4),
                _toner("K", 72, 1),
            ],
            uptime="120d, 18h, 45m",
            reachable=True,
            snmp_responded=True,
        )

    @staticmethod
    def attention_low_toner() -> SNMPResult:
        """Colorida com preto em 15% — abaixo do limite de 20%."""
        return SNMPResult(
            status="atencao",
            page_count=12500,
            toners=[
                _toner("C", 42, 2),
                _toner("M", 38, 3),
                _toner("Y", 25, 4),
                _toner("K", 15, 1),
            ],
            uptime="60d, 12h, 30m",
            reachable=True,
            snmp_responded=True,
        )

    @staticmethod
    def offline() -> SNMPResult:
        """Nao responde ao ping."""
        return SNMPResult(
            status="offline",
            page_count=None,
            toners=[],
            uptime="N/A",
            reachable=False,
            snmp_responded=False,
            error="sem resposta ao ping",
        )

    @staticmethod
    def snmp_error() -> SNMPResult:
        """Responde ao ping, mas a porta 161 fica muda."""
        return SNMPResult(
            status="online",
            page_count=None,
            toners=[],
            uptime="N/A",
            reachable=True,
            snmp_responded=False,
            error="SNMP sem resposta (impressora acessivel, porta 161 muda)",
        )

    @staticmethod
    def snmp_partial() -> SNMPResult:
        """SNMP responde o contador, mas nao expoe a tabela de consumiveis."""
        return SNMPResult(
            status="online",
            page_count=88120,
            toners=[],
            uptime="12d, 4h, 5m",
            reachable=True,
            snmp_responded=True,
            error="SNMP respondeu, mas sem toner disponivel",
        )

    @staticmethod
    def mono_critical() -> SNMPResult:
        """Monocromatica com toner em 5%."""
        return SNMPResult(
            status="atencao",
            page_count=45000,
            toners=[_toner("K", 5, 1)],
            uptime="200d, 5h, 10m",
            reachable=True,
            snmp_responded=True,
        )

    @staticmethod
    def color_mixed_levels() -> SNMPResult:
        """Colorida com ciano critico (18%) e os demais normais."""
        return SNMPResult(
            status="atencao",
            page_count=78900,
            toners=[
                _toner("C", 18, 2),
                _toner("M", 42, 3),
                _toner("Y", 60, 4),
                _toner("K", 85, 1),
            ],
            uptime="90d, 14h, 20m",
            reachable=True,
            snmp_responded=True,
        )


# Fonte unica da lista de cenarios (a API valida contra ela).
SCENARIOS = {
    "online_mono": MockSNMPScenarios.online_mono,
    "online_color": MockSNMPScenarios.online_color,
    "attention_low_toner": MockSNMPScenarios.attention_low_toner,
    "offline": MockSNMPScenarios.offline,
    "snmp_error": MockSNMPScenarios.snmp_error,
    "snmp_partial": MockSNMPScenarios.snmp_partial,
    "mono_critical": MockSNMPScenarios.mono_critical,
    "color_mixed_levels": MockSNMPScenarios.color_mixed_levels,
}


class MockSNMPClient:
    """Substituto do SNMPClient com a mesma assinatura de collect()."""

    def __init__(self, scenario: str = "online_mono"):
        if scenario not in SCENARIOS:
            raise ValueError(
                f"Cenario desconhecido: {scenario!r}. Validos: {', '.join(SCENARIOS)}"
            )
        self.scenario = scenario

    def collect(self, ip: str, is_color: bool = False) -> SNMPResult:
        """Devolve o resultado fixo do cenario (ip e is_color sao ignorados)."""
        return SCENARIOS[self.scenario]()

    @staticmethod
    def list_scenarios() -> list[str]:
        return list(SCENARIOS)
