# Elgin Impressoras

Painel de monitoramento de impressoras em rede — status, níveis de toner, alertas e relatórios em tempo real.

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com)
- [Recharts](https://recharts.org) para os gráficos
- [Lucide](https://lucide.dev) para os ícones

## Desenvolvimento

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Dados: demo, real e simulado

O painel busca `/data/printers.json` e `/data/monthly-report.json` (via
`src/lib/fetchPrinters.ts` / `src/lib/fetchMonthlyReport.ts`). Se nenhum dos
dois existir, ele cai automaticamente no **modo demonstração** — dados fixos
de `src/data/printers.ts`, extraídos da planilha. É o que roda por padrão em
`npm run dev` sem nenhuma configuração extra.

Existem dois jeitos de popular esses arquivos com dados que não sejam a
demonstração fixa:

- **Dados reais** — só funciona de dentro da rede da Elgin (ou VPN), porque
  precisa de acesso RPC aos servidores de impressão e SNMP às impressoras:
  ```powershell
  pwsh .\scripts\Coletar-Impressoras.ps1
  pwsh .\scripts\Relatorio-Mensal.ps1
  ```

- **Dados simulados (testar em casa, sem rede da empresa)** — gera os dois
  arquivos com impressoras fictícias localmente, sem nenhuma chamada de
  rede, no mesmo formato exato dos coletores reais. Útil pra testar
  filtros, alertas, a área de Suprimentos, o Histórico mensal etc. como se
  estivesse conectado, sem precisar da VPN:
  ```powershell
  pwsh .\scripts\Simular-Ambiente.ps1
  ```
  Os nomes das impressoras simuladas começam com `SIM_` e os departamentos
  com `TESTE -`, de propósito, pra nunca confundir com dado real. Para
  voltar ao modo demonstração, apague os arquivos gerados:
  ```bash
  rm public/data/printers.json public/data/monthly-report.json
  ```
  (Esses arquivos são ignorados pelo git — ver `.gitignore` — então gerar ou
  apagar localmente nunca afeta o repositório.)
