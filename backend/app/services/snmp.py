"""
SNMP Collector para impressoras.

Porte direto da funcao Get-TonerSNMP de scripts/Coletar-Impressoras.ps1.
Mantem os mesmos OIDs, a mesma ordem GetBulk -> fallback GET individual,
os mesmos filtros de consumivel e a mesma regra de escolha de toner.
"""
import platform
import re
import socket
import subprocess
from dataclasses import dataclass, field
from typing import Optional

# Tags BER usadas nas respostas SNMP
TAG_INTEGER = 0x02
TAG_OCTET_STRING = 0x04
TAG_NULL = 0x05
TAG_OID = 0x06
TAG_SEQUENCE = 0x30
TAG_COUNTER32 = 0x41
TAG_GAUGE32 = 0x42
TAG_TIMETICKS = 0x43
TAG_COUNTER64 = 0x46

# Tipos numericos aceitos ao ler um valor inteiro (PS1: Parse-SnmpInt/Counter)
NUMERIC_TAGS = (TAG_INTEGER, TAG_COUNTER32, TAG_GAUGE32, TAG_TIMETICKS, TAG_COUNTER64)

# Excecoes SNMPv2: noSuchObject / noSuchInstance / endOfMibView
EXCEPTION_TAGS = (0x80, 0x81, 0x82)

# Consumiveis que nao sao toner (PS1: waste|descarte|lixeira|recovery|container|cleaner)
IGNORE_SUPPLY_RE = re.compile(r"waste|descarte|lixeira|recovery|container|cleaner", re.I)

# Deteccao de cor pela descricao (PS1: mesmos regex, com \b)
COLOR_PATTERNS = (
    ("C", re.compile(r"cyan|ciano|azul|\bc\b", re.I)),
    ("M", re.compile(r"magenta|rosa|\bm\b", re.I)),
    ("Y", re.compile(r"yellow|amarelo|\by\b", re.I)),
    ("K", re.compile(r"black|preto|negro|\bk\b", re.I)),
)

# Ordem de exibicao dos toners coloridos (PS1: pesos Ciano=1, Magenta=2, Amarelo=3, Preto=4)
COLOR_ORDER = {"C": 1, "M": 2, "Y": 3, "K": 4}

# Fallback por indice quando a descricao nao identifica a cor (PS1: $indice % 4)
INDEX_COLOR_FALLBACK = {1: "C", 2: "M", 3: "Y", 0: "K"}


@dataclass
class TonerInfo:
    """Nivel de um consumivel de toner."""

    color: str  # K, C, M, Y
    percent: int  # 0-100
    index: int  # indice na tabela prtMarkerSupplies
    maximum: int = 0  # capacidade total (usado para escolher o toner principal)
    description: str = ""


@dataclass
class SNMPResult:
    """
    Resultado de uma coleta SNMP.

    Distingue os tres cenarios de falha exigidos pela Etapa 6:

      reachable=False                      -> impressora offline (nao responde ao ping)
      reachable=True, snmp_responded=False -> responde ping, mas SNMP mudo
      reachable=True, snmp_responded=True  -> SNMP respondeu (dados podem vir parciais)
    """

    status: str  # online | atencao | offline
    page_count: Optional[int] = None
    toners: list[TonerInfo] = field(default_factory=list)
    uptime: str = "N/A"
    reachable: bool = True
    snmp_responded: bool = False
    error: Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
#  Decodificacao BER
# ─────────────────────────────────────────────────────────────────────────────
def _read_tlv(data: bytes, pos: int) -> tuple[int, int, int, int]:
    """Le um TLV BER. Retorna (tag, length, value_start, next_pos)."""
    if pos + 2 > len(data):
        raise ValueError("TLV truncado")
    tag = data[pos]
    pos += 1
    length = data[pos]
    pos += 1
    if length & 0x80:  # forma longa
        n = length & 0x7F
        if pos + n > len(data):
            raise ValueError("comprimento BER truncado")
        length = 0
        for _ in range(n):
            length = (length << 8) | data[pos]
            pos += 1
    if pos + length > len(data):
        raise ValueError("valor BER truncado")
    return tag, length, pos, pos + length


def _read_oid(data: bytes, pos: int, length: int) -> str:
    """Decodifica um OID BER para notacao pontuada."""
    end = pos + length
    first = data[pos]
    pos += 1
    parts = [str(first // 40), str(first % 40)]
    while pos < end:
        val = 0
        while pos < end:
            b = data[pos]
            pos += 1
            val = (val << 7) | (b & 0x7F)
            if not (b & 0x80):
                break
        parts.append(str(val))
    return ".".join(parts)


def _read_uint(data: bytes) -> int:
    """Decodifica bytes BER como inteiro sem sinal."""
    val = 0
    for b in data:
        val = (val << 8) | b
    return val


def parse_varbinds(data: bytes) -> list[tuple[str, int, bytes]]:
    """
    Extrai a lista de varbinds de uma resposta SNMP.

    Percorre a estrutura completa (SEQUENCE > version, community, PDU >
    request-id, error-status, error-index, varbind-list) em vez de varrer
    bytes soltos — a varredura ingenua casava com o campo `version` e com a
    community string antes de chegar no valor real.

    Retorna [(oid, tag_do_valor, bytes_do_valor)].
    """
    _tag, _len, outer_start, _next = _read_tlv(data, 0)
    pos = outer_start

    _t, _l, _vs, pos = _read_tlv(data, pos)  # version
    _t, _l, _vs, pos = _read_tlv(data, pos)  # community

    _pdu_tag, _pdu_len, pdu_start, _pdu_next = _read_tlv(data, pos)  # PDU
    pos = pdu_start

    _t, _l, _vs, pos = _read_tlv(data, pos)  # request-id
    _t, _l, _vs, pos = _read_tlv(data, pos)  # error-status
    _t, _l, _vs, pos = _read_tlv(data, pos)  # error-index

    _vb_tag, _vb_len, vb_start, vb_end = _read_tlv(data, pos)  # varbind list

    varbinds: list[tuple[str, int, bytes]] = []
    pos = vb_start
    while pos < vb_end:
        _t, _l, inner, next_vb = _read_tlv(data, pos)  # varbind
        _ot, oid_len, oid_start, after_oid = _read_tlv(data, inner)
        oid = _read_oid(data, oid_start, oid_len)
        val_tag, val_len, val_start, _after_val = _read_tlv(data, after_oid)
        varbinds.append((oid, val_tag, data[val_start : val_start + val_len]))
        pos = next_vb
    return varbinds


class SNMPClient:
    """Cliente SNMP para coleta de impressoras (Printer-MIB, RFC 3805)."""

    # OIDs — identicos aos do Coletar-Impressoras.ps1
    OID_UPTIME = "1.3.6.1.2.1.1.3.0"  # sysUpTime
    OID_PAGE_COUNT = "1.3.6.1.2.1.43.10.2.1.4.1.1"  # prtMarkerLifeCount
    OID_TONER_LEVEL = "1.3.6.1.2.1.43.11.1.1.9.1"  # prtMarkerSuppliesLevel
    OID_TONER_MAX = "1.3.6.1.2.1.43.11.1.1.8.1"  # prtMarkerSuppliesMaxCapacity
    OID_TONER_DESC = "1.3.6.1.2.1.43.11.1.1.6.1"  # prtMarkerSuppliesDescription

    TONER_LOW_THRESHOLD = 20  # PS1: $piorPct -le 20 -> "atencao"
    MAX_SUPPLY_INDEX = 20  # PS1: foreach ($indice in 1..20)
    MAX_CONSECUTIVE_FAILS = 3  # PS1: if ($falhasConsecutivas -ge 3) { break }
    BULK_MAX_REPETITIONS = 15  # PS1: -MaxRepetitions 15

    def __init__(self, community: str = "public", timeout: float = 1.5, ping_timeout_ms: int = 400):
        self.community = community
        self.timeout = timeout
        self.ping_timeout_ms = ping_timeout_ms

    # ─────────────────────────────────────────────────────────────────────
    #  Fluxo principal
    # ─────────────────────────────────────────────────────────────────────
    def collect(self, ip: str, is_color: bool = False) -> SNMPResult:
        """
        Coleta status, contador de paginas e toners de uma impressora.

        Nunca levanta excecao: qualquer falha vira um SNMPResult descrevendo
        o que aconteceu, para que a coleta das demais impressoras continue.
        """
        if not ip or not self._is_ip_like(ip):
            return SNMPResult(
                status="offline",
                reachable=False,
                error=f"IP invalido ou ausente: {ip!r}",
            )

        if not self._ping(ip):
            return SNMPResult(status="offline", reachable=False, error="sem resposta ao ping")

        result = SNMPResult(status="online", reachable=True)
        sock: socket.socket | None = None
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(self.timeout)

            uptime_ticks = self._get_numeric(sock, ip, self.OID_UPTIME)
            if uptime_ticks is not None:
                result.snmp_responded = True
                result.uptime = self._format_uptime(uptime_ticks)

            page_count = self._get_numeric(sock, ip, self.OID_PAGE_COUNT)
            if page_count is not None:
                result.snmp_responded = True
                result.page_count = page_count

            candidates, toners_responded = self._collect_supplies(sock, ip, is_color)
            if toners_responded:
                result.snmp_responded = True
            result.toners = self._select_toners(candidates, is_color)

            if not result.snmp_responded:
                result.error = "SNMP sem resposta (impressora acessivel, porta 161 muda)"
            elif result.page_count is None and not result.toners:
                result.error = "SNMP respondeu, mas sem contador nem toner disponiveis"

            if result.toners:
                worst = min(t.percent for t in result.toners)
                if worst <= self.TONER_LOW_THRESHOLD:
                    result.status = "atencao"

        except Exception as exc:  # nunca propaga para nao derrubar a coleta em lote
            result.error = f"{type(exc).__name__}: {exc}"
        finally:
            if sock is not None:
                sock.close()

        return result

    # ─────────────────────────────────────────────────────────────────────
    #  Conectividade
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _is_ip_like(ip: str) -> bool:
        """PS1: `if ($ip -match '^\\d')` — descarta 'N/A' e nomes de porta."""
        return bool(re.match(r"^\d", ip.strip()))

    def _ping(self, ip: str) -> bool:
        """
        ICMP ping, equivalente ao `New-Object ...Ping).Send($ip, 400)` do PS1.

        SNMP roda em UDP/161; abrir um socket TCP nessa porta (implementacao
        anterior) falharia mesmo em impressora saudavel.
        """
        system = platform.system().lower()
        if system == "windows":
            cmd = ["ping", "-n", "1", "-w", str(self.ping_timeout_ms), ip]
        else:
            secs = max(1, round(self.ping_timeout_ms / 1000))
            cmd = ["ping", "-c", "1", "-W", str(secs), ip]

        kwargs = {"capture_output": True, "timeout": (self.ping_timeout_ms / 1000) + 3}
        if system == "windows" and hasattr(subprocess, "CREATE_NO_WINDOW"):
            kwargs["creationflags"] = subprocess.CREATE_NO_WINDOW

        try:
            return subprocess.run(cmd, **kwargs).returncode == 0
        except Exception:
            return False

    # ─────────────────────────────────────────────────────────────────────
    #  Toners: GetBulk com fallback para GET individual (ordem do PS1)
    # ─────────────────────────────────────────────────────────────────────
    def _collect_supplies(
        self, sock: socket.socket, ip: str, is_color: bool
    ) -> tuple[list[TonerInfo], bool]:
        """Retorna (candidatos, houve_resposta_snmp)."""
        candidates = self._supplies_via_bulk(sock, ip, is_color)
        if candidates:
            return candidates, True

        candidates, responded = self._supplies_via_get(sock, ip, is_color)
        return candidates, responded

    def _supplies_via_bulk(
        self, sock: socket.socket, ip: str, is_color: bool
    ) -> list[TonerInfo]:
        """GETBULK das tres colunas de uma vez (PS1: Build-SnmpGetBulk)."""
        try:
            packet = self._build_getbulk(
                [self.OID_TONER_LEVEL, self.OID_TONER_MAX, self.OID_TONER_DESC],
                self.BULK_MAX_REPETITIONS,
            )
            response = self._exchange(sock, ip, packet)
            if not response:
                return []
            varbinds = parse_varbinds(response)
        except Exception:
            return []

        # PS1: exige grupos completos de 3 (nivel, maximo, descricao)
        if len(varbinds) < 3 or len(varbinds) % 3 != 0:
            return []

        candidates: list[TonerInfo] = []
        for i in range(0, len(varbinds), 3):
            level_vb, max_vb, desc_vb = varbinds[i], varbinds[i + 1], varbinds[i + 2]

            # Saiu das colunas pedidas -> fim da tabela
            if not level_vb[0].startswith(self.OID_TONER_LEVEL + ".") or not max_vb[
                0
            ].startswith(self.OID_TONER_MAX + "."):
                break
            if level_vb[1] in EXCEPTION_TAGS or max_vb[1] in EXCEPTION_TAGS:
                break

            try:
                index = int(level_vb[0][len(self.OID_TONER_LEVEL) + 1 :])
            except ValueError:
                break

            level = _read_uint(level_vb[2])
            maximum = _read_uint(max_vb[2])
            desc = ""
            if desc_vb[1] == TAG_OCTET_STRING:
                desc = desc_vb[2].decode("ascii", errors="ignore").strip()

            toner = self._build_toner(index, level, maximum, desc, is_color)
            if toner is not None:
                candidates.append(toner)

        return candidates

    def _supplies_via_get(
        self, sock: socket.socket, ip: str, is_color: bool
    ) -> tuple[list[TonerInfo], bool]:
        """Fallback: um GET por indice (PS1: laco 1..20 com 3 falhas seguidas)."""
        candidates: list[TonerInfo] = []
        consecutive_fails = 0
        responded = False

        for index in range(1, self.MAX_SUPPLY_INDEX + 1):
            level = self._get_numeric(sock, ip, f"{self.OID_TONER_LEVEL}.{index}")
            maximum = self._get_numeric(sock, ip, f"{self.OID_TONER_MAX}.{index}")

            if level is not None or maximum is not None:
                responded = True

            if level is None or maximum is None or maximum <= 0:
                consecutive_fails += 1
                if consecutive_fails >= self.MAX_CONSECUTIVE_FAILS:
                    break
                continue

            consecutive_fails = 0
            desc = self._get_string(sock, ip, f"{self.OID_TONER_DESC}.{index}") or ""

            toner = self._build_toner(index, level, maximum, desc, is_color)
            if toner is not None:
                candidates.append(toner)

            # PS1: mono para no 1o toner; colorida para em 8 candidatos
            if not is_color and candidates:
                break
            if is_color and len(candidates) >= 8:
                break

        return candidates, responded

    def _build_toner(
        self, index: int, level: int, maximum: int, desc: str, is_color: bool
    ) -> Optional[TonerInfo]:
        """Aplica os filtros do PS1 e monta um candidato a toner."""
        if maximum <= 0:
            return None
        if IGNORE_SUPPLY_RE.search(desc):
            return None
        percent = max(0, min(100, round((level / maximum) * 100)))
        return TonerInfo(
            color=self._detect_color(desc, index, is_color),
            percent=percent,
            index=index,
            maximum=maximum,
            description=desc,
        )

    def _select_toners(self, candidates: list[TonerInfo], is_color: bool) -> list[TonerInfo]:
        """
        Escolhe os toners finais.

        PS1 colorida: um por cor (primeiro de cada grupo), ordem C, M, Y, K.
        PS1 mono: apenas o de maior capacidade — evita devolver o kit de
        manutencao no lugar do cartucho principal.
        """
        if not candidates:
            return []

        if not is_color:
            return [max(candidates, key=lambda t: t.maximum)]

        by_color: dict[str, TonerInfo] = {}
        for toner in candidates:
            by_color.setdefault(toner.color, toner)
        return sorted(by_color.values(), key=lambda t: COLOR_ORDER.get(t.color, 99))

    @staticmethod
    def _detect_color(desc: str, index: int, is_color: bool) -> str:
        """Cor pela descricao; se nao identificar e for colorida, usa indice % 4."""
        for color, pattern in COLOR_PATTERNS:
            if pattern.search(desc):
                return color
        if is_color:
            return INDEX_COLOR_FALLBACK.get(index % 4, "K")
        return "K"

    # ─────────────────────────────────────────────────────────────────────
    #  Primitivas SNMP
    # ─────────────────────────────────────────────────────────────────────
    def _get_numeric(self, sock: socket.socket, ip: str, oid: str) -> Optional[int]:
        """GET de um valor numerico (INTEGER, Counter32, Gauge32, TimeTicks)."""
        vb = self._get_varbind(sock, ip, oid)
        if vb is None:
            return None
        _oid, tag, value = vb
        if tag not in NUMERIC_TAGS or not value:
            return None
        return _read_uint(value)

    def _get_string(self, sock: socket.socket, ip: str, oid: str) -> Optional[str]:
        """GET de uma OCTET STRING."""
        vb = self._get_varbind(sock, ip, oid)
        if vb is None:
            return None
        _oid, tag, value = vb
        if tag != TAG_OCTET_STRING:
            return None
        return value.decode("ascii", errors="ignore").strip()

    def _get_varbind(
        self, sock: socket.socket, ip: str, oid: str
    ) -> Optional[tuple[str, int, bytes]]:
        """Envia um GET e devolve o primeiro varbind valido da resposta."""
        try:
            response = self._exchange(sock, ip, self._build_get(oid))
            if not response:
                return None
            varbinds = parse_varbinds(response)
            if not varbinds:
                return None
            first = varbinds[0]
            if first[1] in EXCEPTION_TAGS or first[1] == TAG_NULL:
                return None
            return first
        except Exception:
            return None

    def _exchange(self, sock: socket.socket, ip: str, packet: bytes) -> Optional[bytes]:
        """Envia um pacote e aguarda a resposta (UDP/161)."""
        try:
            sock.sendto(packet, (ip, 161))
            response, _addr = sock.recvfrom(8192)
            return response
        except (socket.timeout, OSError):
            return None

    # ─────────────────────────────────────────────────────────────────────
    #  Codificacao BER dos pedidos
    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _encode_oid(oid: str) -> bytes:
        parts = [int(p) for p in oid.split(".")]
        out = bytearray([parts[0] * 40 + parts[1]])
        for val in parts[2:]:
            if val < 128:
                out.append(val)
            else:
                chunk = bytearray([val & 0x7F])
                val >>= 7
                while val > 0:
                    chunk.insert(0, (val & 0x7F) | 0x80)
                    val >>= 7
                out.extend(chunk)
        return bytes(out)

    @staticmethod
    def _tlv(tag: int, value: bytes) -> bytes:
        if len(value) < 0x80:
            return bytes([tag, len(value)]) + value
        length = len(value)
        length_bytes = length.to_bytes((length.bit_length() + 7) // 8, "big")
        return bytes([tag, 0x80 | len(length_bytes)]) + length_bytes + value

    def _varbind(self, oid: str) -> bytes:
        return self._tlv(
            TAG_SEQUENCE,
            self._tlv(TAG_OID, self._encode_oid(oid)) + self._tlv(TAG_NULL, b""),
        )

    def _wrap(self, version: int, pdu: bytes) -> bytes:
        return self._tlv(
            TAG_SEQUENCE,
            self._tlv(TAG_INTEGER, bytes([version]))
            + self._tlv(TAG_OCTET_STRING, self.community.encode("ascii"))
            + pdu,
        )

    def _build_get(self, oid: str) -> bytes:
        """SNMPv1 GET (PS1: Build-SnmpGet, version 0, PDU 0xA0)."""
        body = (
            self._tlv(TAG_INTEGER, b"\x00\x00\x00\x01")  # request-id
            + self._tlv(TAG_INTEGER, b"\x00")  # error-status
            + self._tlv(TAG_INTEGER, b"\x00")  # error-index
            + self._tlv(TAG_SEQUENCE, self._varbind(oid))
        )
        return self._wrap(0, self._tlv(0xA0, body))

    def _build_getbulk(self, oids: list[str], max_repetitions: int) -> bytes:
        """SNMPv2c GETBULK (PS1: Build-SnmpGetBulk, version 1, PDU 0xA5)."""
        varbinds = b"".join(self._varbind(oid) for oid in oids)
        body = (
            self._tlv(TAG_INTEGER, b"\x00\x00\x00\x02")  # request-id
            + self._tlv(TAG_INTEGER, b"\x00")  # non-repeaters
            + self._tlv(TAG_INTEGER, bytes([max_repetitions]))  # max-repetitions
            + self._tlv(TAG_SEQUENCE, varbinds)
        )
        return self._wrap(1, self._tlv(0xA5, body))

    # ─────────────────────────────────────────────────────────────────────
    @staticmethod
    def _format_uptime(ticks: int) -> str:
        """Ticks de 1/100s -> 'Xd, Yh, Zm' (mesmo formato do PS1)."""
        seconds = ticks / 100
        days = int(seconds // 86400)
        hours = int((seconds % 86400) // 3600)
        minutes = int((seconds % 3600) // 60)
        return f"{days}d, {hours}h, {minutes}m"
