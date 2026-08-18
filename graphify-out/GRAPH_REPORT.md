# Graph Report - PrinterControl  (2026-08-18)

## Corpus Check
- 93 files · ~37,754 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 583 nodes · 1106 edges · 28 communities (20 shown, 8 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 36 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7c94a0ad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app-data.tsx
- package.json
- cn
- Coletar-Impressoras.ps1
- SNMPClient
- Elgin Impressoras (painel de monitoramento)
- compilerOptions
- routes/auth.py
- useAppData
- ComingSoon.tsx
- plugins
- HistoryMatrix.tsx
- graphify (knowledge graph tool)
- next.config.ts
- Elgin (Brand)
- PrinterControl Favicon Icon
- npm run build
- npm run dev
- next-env.d.ts
- navIds.ts
- SNMPResult
- printers.py
- tests_collect_api.py

## God Nodes (most connected - your core abstractions)
1. `SNMPClient` - 32 edges
2. `cn()` - 31 edges
3. `useAppData()` - 21 edges
4. `Elgin Impressoras (painel de monitoramento)` - 20 edges
5. `SNMPResult` - 19 edges
6. `compilerOptions` - 19 edges
7. `useToast()` - 17 edges
8. `PrinterCollector` - 16 edges
9. `useTheme()` - 16 edges
10. `Printer` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Lucide` --conceptually_related_to--> `Elgin Impressoras (painel de monitoramento)`  [EXTRACTED]
  README.md → CONTEXTO-DESENVOLVIMENTO.md
- `React` --conceptually_related_to--> `Elgin Impressoras (painel de monitoramento)`  [EXTRACTED]
  README.md → CONTEXTO-DESENVOLVIMENTO.md
- `Recharts` --conceptually_related_to--> `Elgin Impressoras (painel de monitoramento)`  [EXTRACTED]
  README.md → CONTEXTO-DESENVOLVIMENTO.md
- `Tailwind CSS v4` --conceptually_related_to--> `Elgin Impressoras (painel de monitoramento)`  [EXTRACTED]
  README.md → CONTEXTO-DESENVOLVIMENTO.md
- `TypeScript` --conceptually_related_to--> `Elgin Impressoras (painel de monitoramento)`  [EXTRACTED]
  README.md → CONTEXTO-DESENVOLVIMENTO.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Comandos do CLI graphify (query/path/explain/update)** — claude_graphify, claude_graphify_query, claude_graphify_path, claude_graphify_explain, claude_graphify_update [EXTRACTED 1.00]
- **Stack tecnológico do painel (Vite/React/TS/Tailwind/Recharts/Lucide)** — readme_vite, readme_react, readme_typescript, readme_tailwind_css_v4, readme_recharts, readme_lucide [EXTRACTED 1.00]
- **Arquitetura de dados de 3 modos (Demo/Real/Simulado)** — contexto_desenvolvimento_elgin_impressoras, contexto_desenvolvimento_modo_demo, contexto_desenvolvimento_modo_real, contexto_desenvolvimento_modo_simulado [EXTRACTED 1.00]

## Communities (28 total, 8 thin omitted)

### Community 0 - "app-data.tsx"
Cohesion: 0.06
Nodes (46): Levantamento_impressões (planilha original), AlertsPage(), AlertBanner(), AlertBannerProps, AlertsView(), AlertsViewProps, DepartmentBreakdownProps, MONTHS (+38 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (31): lucide-react, next, oxlint, dependencies, lucide-react, next, react, react-dom (+23 more)

### Community 2 - "cn"
Cohesion: 0.05
Nodes (51): DashboardPage(), AlertsDonutCard(), AlertsDonutCardProps, BottomCharts(), BottomChartsProps, PagesConsumedCard(), TotalPrintsCard(), MonthlyCounters() (+43 more)

### Community 3 - "Coletar-Impressoras.ps1"
Cohesion: 0.09
Nodes (21): Modo Real, Modo Simulado, Contador mensal calculado por diff de duas leituras SNMP acumulativas (não existe OID de páginas do mês), Scripts PowerShell reais nunca rodaram de verdade (sem interpretador PowerShell no ambiente de dev), public/data/monthly-report.json, public/data/printers.json, Arquivos de dados gerados são ignorados pelo git — gerar/apagar localmente nunca afeta o repositório, Impressoras simuladas usam prefixo SIM_ / departamentos TESTE - de propósito, pra nunca confundir com dado real (+13 more)

### Community 4 - "SNMPClient"
Cohesion: 0.05
Nodes (40): Agente SNMP simulado — APENAS PARA TESTE LOCAL. Existe porque a maquina de…, _toner(), parse_varbinds(), SNMP Collector para impressoras. Porte direto da funcao Get-TonerSNMP de…, Decodifica um OID BER para notacao pontuada., Decodifica bytes BER como inteiro sem sinal., Extrai a lista de varbinds de uma resposta SNMP. Percorre a estrutura completa…, Cliente SNMP para coleta de impressoras (Printer-MIB, RFC 3805). (+32 more)

### Community 5 - "Elgin Impressoras (painel de monitoramento)"
Cohesion: 0.06
Nodes (31): Tela Alertas, Tela Dashboard, Elgin Impressoras (painel de monitoramento), Tela Histórico, Tela Impressoras, Tela Login, Migração futura para FastAPI (Python) + Next.js + banco de dados, Modo claro/escuro (toggle) (+23 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+22 more)

### Community 7 - "routes/auth.py"
Cohesion: 0.09
Nodes (35): Config, Settings, create_db_and_tables(), get_session(), health_check(), on_startup(), get, read_root() (+27 more)

### Community 8 - "useAppData"
Cohesion: 0.07
Nodes (32): react, ibmPlexMono, metadata, publicSans, sourceSerif, PrintersPage(), Providers(), ReportsPage() (+24 more)

### Community 10 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 11 - "HistoryMatrix.tsx"
Cohesion: 0.27
Nodes (5): HistoryPage(), HistoryMatrix(), HistoryMatrixProps, getDepartmentLabel(), getPrinterSite()

### Community 12 - "graphify (knowledge graph tool)"
Cohesion: 0.25
Nodes (8): graphify (knowledge graph tool), graphify explain command, graphify path command, graphify query command, graphify update command, graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify-out/wiki/index.md

### Community 20 - "SNMPResult"
Cohesion: 0.06
Nodes (27): list_scenarios(), get, Cenarios simulados disponiveis e se o modo mock esta habilitado., PrinterCollector, Session, Converte SNMPResult em PrinterReading. Toner ausente vira NULL (a coluna e…, Cenarios de teste disponiveis (fonte unica: snmp_mock.SCENARIOS)., Coleta uma impressora e grava o resultado como PrinterReading. (+19 more)

### Community 21 - "printers.py"
Cohesion: 0.11
Nodes (33): Alert, SQLModel, TonerHistory, Printer, PrinterMonthly, PrinterReading, SQLModel, get_alert() (+25 more)

### Community 22 - "tests_collect_api.py"
Cohesion: 0.67
Nodes (3): check(), main(), Teste ponta a ponta dos endpoints /api/collect com os cenarios simulados.…

## Knowledge Gaps
- **137 isolated node(s):** `Config`, `Config`, `nextConfig`, `name`, `private` (+132 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `SNMPClient` connect `SNMPClient` to `SNMPResult`, `printers.py`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Why does `Elgin Impressoras (painel de monitoramento)` connect `Elgin Impressoras (painel de monitoramento)` to `Coletar-Impressoras.ps1`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `public/data/printers.json` connect `Coletar-Impressoras.ps1` to `app-data.tsx`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `SNMPClient` (e.g. with `PrinterCollector` and `FakeAgent`) actually correct?**
  _`SNMPClient` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `SNMPResult` (e.g. with `PrinterCollector` and `MockSNMPClient`) actually correct?**
  _`SNMPResult` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Config`, `nextConfig` to the rest of the system?**
  _137 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app-data.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0629800307219662 - nodes in this community are weakly interconnected._