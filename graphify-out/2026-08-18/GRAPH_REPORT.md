# Graph Report - PrinterControl  (2026-08-18)

## Corpus Check
- 66 files · ~30,727 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 370 nodes · 715 edges · 20 communities (12 shown, 8 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.57)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1382e6ac`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app-data.tsx
- package.json
- cn
- Coletar-Impressoras.ps1
- theme.tsx
- Elgin Impressoras (painel de monitoramento)
- compilerOptions
- Sidebar.tsx
- useAppData
- ComingSoon.tsx
- plugins
- types.ts
- graphify (knowledge graph tool)
- next.config.ts
- Elgin (Brand)
- PrinterControl Favicon Icon
- npm run build
- npm run dev
- next-env.d.ts
- navIds.ts

## God Nodes (most connected - your core abstractions)
1. `cn()` - 32 edges
2. `Printer` - 25 edges
3. `useAppData()` - 21 edges
4. `Elgin Impressoras (painel de monitoramento)` - 20 edges
5. `compilerOptions` - 19 edges
6. `react` - 17 edges
7. `useToast()` - 17 edges
8. `useTheme()` - 16 edges
9. `AppDataProvider()` - 15 edges
10. `PrinterTable()` - 11 edges

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

## Communities (20 total, 8 thin omitted)

### Community 0 - "app-data.tsx"
Cohesion: 0.09
Nodes (31): Levantamento_impressões (planilha original), DecommissionedList(), DecommissionedListProps, DepartmentBreakdown(), DepartmentBreakdownProps, MONTHS, RightPanelProps, Account (+23 more)

### Community 1 - "package.json"
Cohesion: 0.06
Nodes (31): lucide-react, next, oxlint, dependencies, lucide-react, next, react, react-dom (+23 more)

### Community 2 - "cn"
Cohesion: 0.08
Nodes (38): AlertBanner(), AlertBannerProps, AlertsDonutCard(), AlertsDonutCardProps, BottomCharts(), BottomChartsProps, PagesConsumedCard(), TotalPrintsCard() (+30 more)

### Community 3 - "Coletar-Impressoras.ps1"
Cohesion: 0.09
Nodes (21): Modo Real, Modo Simulado, Contador mensal calculado por diff de duas leituras SNMP acumulativas (não existe OID de páginas do mês), Scripts PowerShell reais nunca rodaram de verdade (sem interpretador PowerShell no ambiente de dev), public/data/monthly-report.json, public/data/printers.json, Arquivos de dados gerados são ignorados pelo git — gerar/apagar localmente nunca afeta o repositório, Impressoras simuladas usam prefixo SIM_ / departamentos TESTE - de propósito, pra nunca confundir com dado real (+13 more)

### Community 4 - "theme.tsx"
Cohesion: 0.14
Nodes (11): ibmPlexMono, metadata, publicSans, sourceSerif, Providers(), getInitialTheme(), Theme, ThemeContext (+3 more)

### Community 5 - "Elgin Impressoras (painel de monitoramento)"
Cohesion: 0.10
Nodes (21): Tela Alertas, Tela Dashboard, Elgin Impressoras (painel de monitoramento), Tela Histórico, Tela Impressoras, Tela Login, Migração futura para FastAPI (Python) + Next.js + banco de dados, Modo claro/escuro (toggle) (+13 more)

### Community 6 - "compilerOptions"
Cohesion: 0.06
Nodes (30): dom, dom.iterable, esnext, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts (+22 more)

### Community 7 - "Sidebar.tsx"
Cohesion: 0.14
Nodes (12): Logo Elgin é redesenho à mão (IA sem acesso a imagens coladas no chat, só uploads), src/components/ (padrão com header-comment por arquivo), ElginLogo(), ElginLogoProps, NavItem(), NavItemProps, Pill(), SidebarProps (+4 more)

### Community 8 - "useAppData"
Cohesion: 0.08
Nodes (30): react, DashboardPage(), PrintersPage(), ReportsPage(), TonerPage(), AppShell(), AuthGate(), ACTIVE_NODES (+22 more)

### Community 10 - "plugins"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 11 - "types.ts"
Cohesion: 0.10
Nodes (24): AlertsPage(), HistoryPage(), AlertsView(), AlertsViewProps, HistoryMatrix(), HistoryMatrixProps, PrinterDetailsModalProps, PrinterRanking() (+16 more)

### Community 12 - "graphify (knowledge graph tool)"
Cohesion: 0.25
Nodes (8): graphify (knowledge graph tool), graphify explain command, graphify path command, graphify query command, graphify update command, graphify-out/graph.json, graphify-out/GRAPH_REPORT.md, graphify-out/wiki/index.md

## Knowledge Gaps
- **120 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+115 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Elgin Impressoras (painel de monitoramento)` connect `Elgin Impressoras (painel de monitoramento)` to `Coletar-Impressoras.ps1`, `Sidebar.tsx`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Why does `public/data/printers.json` connect `Coletar-Impressoras.ps1` to `app-data.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `react` connect `useAppData` to `app-data.tsx`, `cn`, `theme.tsx`, `Sidebar.tsx`, `plugins`, `types.ts`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _120 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `app-data.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08637873754152824 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.0625 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.07676767676767676 - nodes in this community are weakly interconnected._