"""
Validacao local do SNMPClient sem impressoras reais.

Sobe um agente SNMP falso em UDP (127.0.0.1) que responde aos mesmos OIDs
da Printer-MIB e exercita o caminho SNMP REAL de ponta a ponta: codificacao
do pedido, GETBULK, fallback para GET individual, parsing e classificacao.

Uso:
    python tests_snmp_local.py
"""
import socket
import threading
import time

from app.services.snmp import (
    EXCEPTION_TAGS,
    TAG_COUNTER32,
    TAG_INTEGER,
    TAG_OCTET_STRING,
    TAG_SEQUENCE,
    TAG_TIMETICKS,
    SNMPClient,
    _read_oid,
    _read_tlv,
    parse_varbinds,
)

OK = "[OK]"
FAIL = "[FALHA]"
_falhas = []


def check(nome, obtido, esperado):
    if obtido == esperado:
        print(f"  {OK} {nome}: {obtido!r}")
    else:
        print(f"  {FAIL} {nome}: obtido {obtido!r}, esperado {esperado!r}")
        _falhas.append(nome)


# ─────────────────────────────────────────────────────────────────────────────
#  Agente SNMP falso
# ─────────────────────────────────────────────────────────────────────────────
class FakeAgent(threading.Thread):
    """Responde GET e GETBULK para um conjunto de OIDs configurado."""

    daemon = True

    def __init__(self, supplies, page_count=123456, uptime=500000, support_bulk=True, mute=False):
        super().__init__()
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(("127.0.0.1", 0))
        self.port = self.sock.getsockname()[1]
        self.supplies = supplies  # [(index, level, max, desc)]
        self.page_count = page_count
        self.uptime = uptime
        self.support_bulk = support_bulk
        self.mute = mute
        self.running = True
        self._c = SNMPClient()

    def stop(self):
        self.running = False
        try:
            self.sock.close()
        except Exception:
            pass

    # -- tabela de valores ------------------------------------------------
    def values(self):
        v = {
            SNMPClient.OID_UPTIME: (TAG_TIMETICKS, self.uptime),
            SNMPClient.OID_PAGE_COUNT: (TAG_COUNTER32, self.page_count),
        }
        for idx, level, maximum, desc in self.supplies:
            v[f"{SNMPClient.OID_TONER_LEVEL}.{idx}"] = (TAG_INTEGER, level)
            v[f"{SNMPClient.OID_TONER_MAX}.{idx}"] = (TAG_INTEGER, maximum)
            v[f"{SNMPClient.OID_TONER_DESC}.{idx}"] = (TAG_OCTET_STRING, desc)
        return v

    def _encode_value(self, tag, value):
        if tag == TAG_OCTET_STRING:
            return self._c._tlv(tag, value.encode("ascii"))
        if value == 0:
            return self._c._tlv(tag, b"\x00")
        raw = value.to_bytes((value.bit_length() + 7) // 8, "big")
        return self._c._tlv(tag, raw)

    def _varbind(self, oid, tag, value):
        return self._c._tlv(
            TAG_SEQUENCE,
            self._c._tlv(0x06, self._c._encode_oid(oid)) + self._encode_value(tag, value),
        )

    def _response(self, varbinds_payload, request_id=b"\x00\x00\x00\x01"):
        body = (
            self._c._tlv(TAG_INTEGER, request_id)
            + self._c._tlv(TAG_INTEGER, b"\x00")
            + self._c._tlv(TAG_INTEGER, b"\x00")
            + self._c._tlv(TAG_SEQUENCE, varbinds_payload)
        )
        return self._c._wrap(0, self._c._tlv(0xA2, body))

    # -- leitura do pedido ------------------------------------------------
    @staticmethod
    def _request_oids(data):
        """Extrai (pdu_tag, [oids]) de um GET/GETBULK."""
        _t, _l, outer, _n = _read_tlv(data, 0)
        pos = outer
        _t, _l, _v, pos = _read_tlv(data, pos)  # version
        _t, _l, _v, pos = _read_tlv(data, pos)  # community
        pdu_tag, _l, pdu_start, _n = _read_tlv(data, pos)
        pos = pdu_start
        for _ in range(3):
            _t, _l, _v, pos = _read_tlv(data, pos)
        _t, _l, vb_start, vb_end = _read_tlv(data, pos)
        oids, pos = [], vb_start
        while pos < vb_end:
            _t, _l, inner, nxt = _read_tlv(data, pos)
            _ot, olen, ostart, _after = _read_tlv(data, inner)
            oids.append(_read_oid(data, ostart, olen))
            pos = nxt
        return pdu_tag, oids

    def run(self):
        while self.running:
            try:
                data, addr = self.sock.recvfrom(8192)
            except Exception:
                return
            if self.mute:
                continue
            try:
                pdu_tag, oids = self._request_oids(data)
                values = self.values()

                if pdu_tag == 0xA5:  # GETBULK
                    if not self.support_bulk:
                        continue  # agente sem v2c: nao responde
                    payload = b""
                    for idx, _lvl, _max, _desc in self.supplies:
                        for col in (
                            SNMPClient.OID_TONER_LEVEL,
                            SNMPClient.OID_TONER_MAX,
                            SNMPClient.OID_TONER_DESC,
                        ):
                            oid = f"{col}.{idx}"
                            tag, val = values[oid]
                            payload += self._varbind(oid, tag, val)
                    self.sock.sendto(self._response(payload), addr)
                else:  # GET
                    oid = oids[0]
                    if oid in values:
                        tag, val = values[oid]
                        self.sock.sendto(self._response(self._varbind(oid, tag, val)), addr)
                    else:
                        # noSuchInstance
                        payload = self._c._tlv(
                            TAG_SEQUENCE,
                            self._c._tlv(0x06, self._c._encode_oid(oid))
                            + self._c._tlv(0x81, b""),
                        )
                        self.sock.sendto(self._response(payload), addr)
            except Exception:
                continue


class LocalSNMPClient(SNMPClient):
    """SNMPClient apontando para a porta do agente falso, sem depender de ICMP."""

    def __init__(self, port, **kw):
        super().__init__(**kw)
        self.port = port

    def _ping(self, ip):
        return True

    def _exchange(self, sock, ip, packet):
        try:
            sock.sendto(packet, ("127.0.0.1", self.port))
            resp, _ = sock.recvfrom(8192)
            return resp
        except (socket.timeout, OSError):
            return None


# ─────────────────────────────────────────────────────────────────────────────
def main():
    print("=" * 70)
    print("VALIDACAO DO CAMINHO SNMP REAL (agente falso em UDP local)")
    print("=" * 70)

    c = SNMPClient()

    # 1. BER: ida e volta
    print("\n[1] Codificacao/decodificacao BER")
    check("encode OID 1.3.6.1.2.1.1.3.0", c._encode_oid("1.3.6.1.2.1.1.3.0").hex(),
          "2b06010201010300")
    pkt = c._build_get(SNMPClient.OID_PAGE_COUNT)
    check("GET e SEQUENCE valida", pkt[0], 0x30)
    check("GET declara version 0 (v1)", pkt[4], 0x00)
    bulk = c._build_getbulk([SNMPClient.OID_TONER_LEVEL], 15)
    check("GETBULK declara version 1 (v2c)", bulk[4], 0x01)
    check("GETBULK usa PDU 0xA5", 0xA5 in bulk, True)

    # 2. Parsing dos tipos que o codigo anterior errava
    print("\n[2] Parsing de tipos SNMP")
    agent = FakeAgent(supplies=[(1, 8500, 10000, "Black Toner Cartridge")])
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port)
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2)
    check("TimeTicks (sysUpTime)", cli._get_numeric(sock, "127.0.0.1", SNMPClient.OID_UPTIME), 500000)
    check("Counter32 (page count)", cli._get_numeric(sock, "127.0.0.1", SNMPClient.OID_PAGE_COUNT), 123456)
    check("INTEGER (toner level)",
          cli._get_numeric(sock, "127.0.0.1", f"{SNMPClient.OID_TONER_LEVEL}.1"), 8500)
    check("OCTET STRING (descricao)",
          cli._get_string(sock, "127.0.0.1", f"{SNMPClient.OID_TONER_DESC}.1"),
          "Black Toner Cartridge")
    check("noSuchInstance vira None",
          cli._get_numeric(sock, "127.0.0.1", f"{SNMPClient.OID_TONER_LEVEL}.99"), None)
    sock.close()

    # 3. Mono via GETBULK
    print("\n[3] Impressora monocromatica (GETBULK)")
    r = cli.collect("127.0.0.1", is_color=False)
    check("status", r.status, "online")
    check("snmp_responded", r.snmp_responded, True)
    check("page_count", r.page_count, 123456)
    check("qtd toners", len(r.toners), 1)
    check("cor", r.toners[0].color, "K")
    check("percentual", r.toners[0].percent, 85)
    check("uptime (500000 ticks = 5000s)", r.uptime, "0d, 1h, 23m")
    agent.stop()

    # 4. Colorida + descarte de waste toner
    print("\n[4] Impressora colorida + filtro de consumivel")
    agent = FakeAgent(supplies=[
        (1, 7200, 10000, "Black Toner"),
        (2, 5800, 10000, "Cyan Toner"),
        (3, 6100, 10000, "Magenta Toner"),
        (4, 5500, 10000, "Yellow Toner"),
        (5, 9000, 10000, "Waste Toner Container"),
    ])
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port)
    r = cli.collect("127.0.0.1", is_color=True)
    check("qtd toners (waste excluido)", len(r.toners), 4)
    check("ordem C,M,Y,K", [t.color for t in r.toners], ["C", "M", "Y", "K"])
    check("percentuais", {t.color: t.percent for t in r.toners},
          {"C": 58, "M": 61, "Y": 55, "K": 72})
    check("status", r.status, "online")
    agent.stop()

    # 5. Toner baixo -> atencao
    print("\n[5] Toner baixo dispara status 'atencao'")
    agent = FakeAgent(supplies=[(1, 1500, 10000, "Black Toner")])
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port)
    r = cli.collect("127.0.0.1", is_color=False)
    check("percentual", r.toners[0].percent, 15)
    check("status", r.status, "atencao")
    agent.stop()

    # 6. Fallback GET individual (agente sem GETBULK)
    print("\n[6] Fallback para GET individual (agente sem v2c)")
    agent = FakeAgent(supplies=[(1, 4000, 10000, "Black Toner")], support_bulk=False)
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port, timeout=0.4)
    r = cli.collect("127.0.0.1", is_color=False)
    check("qtd toners", len(r.toners), 1)
    check("percentual", r.toners[0].percent, 40)
    check("snmp_responded", r.snmp_responded, True)
    agent.stop()

    # 7. Mono escolhe o de maior capacidade (regra do PS1)
    print("\n[7] Mono: escolhe o consumivel de maior capacidade")
    agent = FakeAgent(supplies=[
        (1, 500, 1000, "Maintenance Kit"),
        (2, 9000, 20000, "Black Toner"),
    ], support_bulk=True)
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port)
    r = cli.collect("127.0.0.1", is_color=False)
    check("escolheu maior capacidade", r.toners[0].maximum, 20000)
    check("percentual", r.toners[0].percent, 45)
    agent.stop()

    # 8. SNMP mudo (ping ok, porta 161 sem resposta)
    print("\n[8] SNMP sem resposta (porta muda)")
    agent = FakeAgent(supplies=[(1, 5000, 10000, "Black")], mute=True)
    agent.start()
    time.sleep(0.2)
    cli = LocalSNMPClient(agent.port, timeout=0.3)
    r = cli.collect("127.0.0.1", is_color=False)
    check("reachable", r.reachable, True)
    check("snmp_responded", r.snmp_responded, False)
    check("status", r.status, "online")
    check("page_count", r.page_count, None)
    check("qtd toners", len(r.toners), 0)
    check("tem mensagem de erro", bool(r.error), True)
    agent.stop()

    # 9. IP invalido / ausente
    print("\n[9] IP invalido ('N/A')")
    r = SNMPClient().collect("N/A", is_color=False)
    check("status", r.status, "offline")
    check("reachable", r.reachable, False)

    # 10. Host inalcancavel (ping falha)
    print("\n[10] Host inalcancavel (ping falha)")
    r = SNMPClient(timeout=0.3).collect("192.0.2.1", is_color=False)  # TEST-NET-1, RFC 5737
    check("status", r.status, "offline")
    check("reachable", r.reachable, False)
    check("snmp_responded", r.snmp_responded, False)

    print("\n" + "=" * 70)
    if _falhas:
        print(f"{FAIL} {len(_falhas)} verificacao(oes) falharam: {_falhas}")
        return 1
    print(f"{OK} Todas as verificacoes do caminho SNMP real passaram.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
