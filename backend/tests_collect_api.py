"""
Teste ponta a ponta dos endpoints /api/collect com os cenarios simulados.

Requer o backend rodando em http://127.0.0.1:8000.
Uso:  python tests_collect_api.py
"""
import sqlite3

import requests

BASE = "http://127.0.0.1:8000"
DB = "printer_control.db"
_falhas = []


def check(nome, obtido, esperado):
    if obtido == esperado:
        print(f"  [OK] {nome}: {obtido!r}")
    else:
        print(f"  [FALHA] {nome}: obtido {obtido!r}, esperado {esperado!r}")
        _falhas.append(nome)


def main():
    print("=" * 70)
    print("TESTE DOS ENDPOINTS /api/collect (modo mock)")
    print("=" * 70)

    login = requests.post(
        f"{BASE}/api/auth/login",
        json={"email": "mateus.vicentino@example.com", "password": "123"},
        timeout=5,
    )
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    print("\n[1] GET /api/collect/scenarios")
    r = requests.get(f"{BASE}/api/collect/scenarios", headers=headers, timeout=5)
    body = r.json()
    check("HTTP", r.status_code, 200)
    check("mock habilitado", body["mock_enabled"], True)
    check("qtd cenarios", len(body["scenarios"]), 8)
    print(f"       {body['scenarios']}")

    # (cenario, is_color, status, page_count, toner_count, reachable, snmp_responded)
    casos = [
        ("online_mono", False, "online", 5000, 1, True, True),
        ("online_color", True, "online", 3500, 4, True, True),
        ("attention_low_toner", True, "atencao", 12500, 4, True, True),
        ("offline", False, "offline", None, 0, False, False),
        ("snmp_error", False, "online", None, 0, True, False),
        ("snmp_partial", False, "online", 88120, 0, True, True),
        ("mono_critical", False, "atencao", 45000, 1, True, True),
        ("color_mixed_levels", True, "atencao", 78900, 4, True, True),
    ]

    print("\n[2] Coleta de cada cenario (POST /api/collect/printers/1)")
    ids = []
    for cenario, is_color, status, pages, toners, reach, snmp in casos:
        r = requests.post(
            f"{BASE}/api/collect/printers/1",
            json={"mode": "mock", "scenario": cenario, "is_color": is_color},
            headers=headers,
            timeout=10,
        )
        if r.status_code != 200:
            print(f"  [FALHA] {cenario}: HTTP {r.status_code} {r.text[:120]}")
            _falhas.append(cenario)
            continue
        d = r.json()
        ids.append(d["reading_id"])
        ok = (
            d["status"] == status
            and d["page_count"] == pages
            and d["toner_count"] == toners
            and d["reachable"] == reach
            and d["snmp_responded"] == snmp
        )
        marca = "[OK]" if ok else "[FALHA]"
        if not ok:
            _falhas.append(cenario)
        print(
            f"  {marca} {cenario:20} status={d['status']:8} pages={str(d['page_count']):6} "
            f"toners={d['toner_count']} reachable={d['reachable']} snmp={d['snmp_responded']} "
            f"id={d['reading_id']}"
        )
        if d["toners"]:
            print(f"       niveis: {d['toners']}")

    print("\n[3] Persistencia no SQLite (consulta direta ao arquivo .db)")
    con = sqlite3.connect(DB)
    marks = ",".join("?" * len(ids))
    rows = con.execute(
        f"SELECT id,status,page_count,toner_k,toner_c,toner_m,toner_y,timestamp "
        f"FROM printer_readings WHERE id IN ({marks}) ORDER BY id",
        ids,
    ).fetchall()
    con.close()
    check("linhas gravadas", len(rows), len(ids))
    for row in rows:
        print(f"       id={row[0]} status={row[1]:8} pages={row[2]:6} "
              f"K={row[3]} C={row[4]} M={row[5]} Y={row[6]} ts={row[7]}")

    mono = [r for r in rows if r[1] == "online" and r[2] == 5000][0]
    check("mono grava so toner_k", (mono[4], mono[5], mono[6]), (None, None, None))
    color = [r for r in rows if r[2] == 3500][0]
    check("colorida grava CMYK", all(v is not None for v in color[3:7]), True)
    off = [r for r in rows if r[1] == "offline"][0]
    check("offline: page_count=0, toners nulos", (off[2], off[3], off[4], off[5], off[6]),
          (0, None, None, None, None))

    print("\n[4] Historico via API (GET /api/printers/1/readings)")
    r = requests.get(f"{BASE}/api/printers/1/readings", headers=headers, timeout=5)
    check("HTTP", r.status_code, 200)
    hist_ids = {x["id"] for x in r.json()}
    check("todas as leituras aparecem no historico", set(ids).issubset(hist_ids), True)

    print("\n[5] Validacao de entrada")
    r = requests.post(
        f"{BASE}/api/collect/printers/1",
        json={"mode": "mock", "scenario": "nao_existe"},
        headers=headers, timeout=5,
    )
    check("cenario invalido -> 400", r.status_code, 400)

    r = requests.post(
        f"{BASE}/api/collect/printers/999999",
        json={"mode": "mock", "scenario": "online_mono"},
        headers=headers, timeout=5,
    )
    check("impressora inexistente -> 404", r.status_code, 404)

    r = requests.post(
        f"{BASE}/api/collect/printers/1",
        json={"mode": "invalido"},
        headers=headers, timeout=5,
    )
    check("modo invalido -> 422", r.status_code, 422)

    print("\n[6] Deducao automatica de colorida/mono (sem is_color)")
    r = requests.post(
        f"{BASE}/api/collect/printers/1",
        json={"mode": "mock", "scenario": "online_mono"},
        headers=headers, timeout=5,
    )
    check("is_color deduzido do modelo", r.json()["is_color"], False)

    print("\n" + "=" * 70)
    if _falhas:
        print(f"[FALHA] {len(_falhas)} verificacao(oes): {_falhas}")
        return 1
    print("[OK] Todos os cenarios passaram e foram persistidos no SQLite.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
