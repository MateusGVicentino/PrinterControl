# Contexto de desenvolvimento — Elgin Impressoras

Resumo do que foi construído até agora, pra qualquer pessoa (ou sessão de
IA) que continue esse projeto sem ter acompanhado o histórico da conversa.

## O que é o projeto

Painel web de monitoramento de impressoras da Elgin: status (online/
offline/atenção), níveis de toner por canal, alertas, contadores mensais
de páginas impressas e histórico por unidade/departamento. Frontend puro
(Vite + React + TypeScript + Tailwind v4), sem backend — os dados vêm de
arquivos JSON estáticos em `public/data/`, gerados por scripts PowerShell
que rodam na rede da empresa.

## Arquitetura de dados: 3 modos

1. **Demo** (padrão, sem nenhuma configuração) — dados fixos de
   `src/data/printers.ts`, extraídos de uma planilha real de levantamento
   de impressões (`Levantamento_impressões`). É o que roda em `npm run dev`
   do zero.
2. **Real** — `scripts/Coletar-Impressoras.ps1` (status/toner via SNMP +
   servidores de impressão) e `scripts/Relatorio-Mensal.ps1` (contador
   mensal, calculado por diff de duas leituras do contador SNMP
   acumulativo — não existe OID de "páginas do mês"). Só funciona de
   dentro da rede da Elgin/VPN.
3. **Simulado** — `scripts/Simular-Ambiente.ps1` (novo). Gera os mesmos
   dois arquivos JSON com dados fictícios, sem nenhuma chamada de rede,
   pra testar o sistema inteiro de casa. Ver README.md, seção "Dados: demo,
   real e simulado".

O app decide o modo automaticamente: tenta buscar `/data/printers.json` e
`/data/monthly-report.json`; se não existirem ou forem inválidos, cai no
demo. O rodapé do painel sempre mostra qual modo está ativo.

## O que existe hoje (visão geral das telas)

- **Dashboard** — cards de status, alertas em destaque, tabela de
  impressoras (versão compacta), níveis de toner globais, gráficos de
  consumo/impressões/alertas, "última verificação + verificar agora".
- **Impressoras** — tabela completa (todas as colunas), busca, filtros,
  paginação, visão lista/grade.
- **Suprimentos** (novo) — monitoramento de toner dedicado: contagem
  crítico/baixo/normal/sem comunicação, tabela com todos os canais de
  toner por impressora, filtros, busca, "atualizar agora".
- **Alertas** — lista completa, filtro por severidade (crítico/atenção).
- **Relatórios** — resumo da frota, contadores mensais (cards com
  variação % mês a mês), ranking (impressoras que mais/menos imprimem),
  consumo por departamento, impressoras devolvidas/fora de operação,
  exportar CSV.
- **Histórico** — matriz completa impressora × mês, agrupada por
  site/unidade, com subtotais e total geral (reproduz a planilha
  original).
- **Login** — autenticação fake (duas contas hardcoded em
  `src/data/accounts.ts`, sem backend real), tela com identidade visual
  Elgin.
- **Modo claro/escuro** — toggle no topo, paleta vibrante no escuro,
  persistido em localStorage.

Tudo em `src/components/`, com header-comment em cada arquivo explicando
dependências externas/locais.

## Limitações conhecidas / dívida técnica

- **Login não é autenticação real** — é só uma checagem client-side contra
  uma lista fixa de contas. Não usar como controle de acesso de verdade
  sem trocar por um backend real.
- **Logo da Elgin é um redesenho à mão**, não o arquivo vetorial oficial —
  o ambiente onde a IA rodou não tem acesso a imagens coladas no chat, só
  uploads de arquivo. Pra trocar pelo arquivo real: suba um `.svg`/`.png`
  em `public/` e troque o conteúdo de `src/components/ElginLogo.tsx` por
  um `<img>`.
- **`Coletar-Impressoras.ps1` e `Relatorio-Mensal.ps1` nunca rodaram de
  verdade** — foram escritos/revisados sem um interpretador PowerShell
  disponível no ambiente de desenvolvimento. `Simular-Ambiente.ps1` foi
  validado indiretamente (mesma lógica portada pra Node e testada contra o
  app real), mas os dois scripts originais que batem em SNMP/servidores de
  impressão de verdade ainda precisam de um primeiro teste em campo.
- **`departmentUsage` e `decommissionedPrinters`** (Consumo por
  Departamento, Impressoras Devolvidas) só existem no modo demo — nenhum
  script gera essas duas listas a partir de dados reais, elas vêm direto
  da planilha original importada uma vez.
- **Sem backend/banco de dados** — combinado internamente que a migração
  pra FastAPI (Python) + Next.js + banco de dados fica pra uma conversa
  futura; nada disso foi iniciado.

## Como continuar

- `npm run dev` pra desenvolver, `npm run build` pra validar antes de
  qualquer entrega.
- Pra testar como se tivesse dados reais sem estar na rede da empresa:
  `pwsh scripts/Simular-Ambiente.ps1` e depois `npm run dev`.
- O push direto pro GitHub a partir do ambiente de IA está bloqueado (403,
  permissão do GitHub App) — o fluxo até agora tem sido: a IA commita
  local e entrega um `.zip` do projeto pra você aplicar manualmente
  (`git apply`/substituir arquivos/etc.) ou resolver a permissão do App no
  GitHub.
