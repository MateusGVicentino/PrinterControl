/**
 * App.tsx — componente raiz: dono de todo o estado (impressoras, filtros,
 * conta logada, navegação) e responsável por orquestrar os dados reais vs.
 * demo. Os componentes filhos (Sidebar, PrinterTable, BottomCharts, etc.)
 * são "burros" — recebem dados prontos via props, sem buscar nada sozinhos.
 *
 * Dependências externas: react (useState/useEffect/useMemo) e lucide-react
 * (ícones do menu "Central de Ajuda" e das seções "Em breve").
 * Dependências locais principais:
 *  - data/printers.ts        → dataset de demonstração (extraído da planilha)
 *  - data/accounts.ts        → contas de login hardcoded (sem backend real)
 *  - lib/fetchPrinters.ts    → busca /data/printers.json (Coletar-Impressoras.ps1)
 *  - lib/fetchMonthlyReport.ts → busca /data/monthly-report.json (Relatorio-Mensal.ps1)
 *  - lib/deriveFromPrinters.ts → calcula alertas/toner-global a partir da frota
 *  - lib/filterPrinters.ts   → filtro compartilhado (status/tipo/depto/busca)
 *  - lib/exportCsv.ts        → exportação de CSV client-side
 *  - lib/toast.tsx           → sistema de notificação (Context + hook)
 */
import { useEffect, useMemo, useState } from "react";
import { FileBarChart2, Network, UserCog, Bell, Plug, Settings, Download, LifeBuoy, Mail, MessageCircle, RefreshCw } from "lucide-react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import StatCards from "./components/StatCards";
import AlertBanner from "./components/AlertBanner";
import PrinterTable from "./components/PrinterTable";
import RightPanel from "./components/RightPanel";
import BottomCharts from "./components/BottomCharts";
import Login from "./components/Login";
import Modal from "./components/Modal";
import PrinterDetailsModal from "./components/PrinterDetailsModal";
import AlertsView from "./components/AlertsView";
import ComingSoon from "./components/ComingSoon";
import DepartmentBreakdown from "./components/DepartmentBreakdown";
import DecommissionedList from "./components/DecommissionedList";
import MonthlyCounters from "./components/MonthlyCounters";
import HistoryMatrix from "./components/HistoryMatrix";
import TonerMonitoring from "./components/TonerMonitoring";
import PrinterRanking from "./components/PrinterRanking";
import {
  printers as mockPrinters,
  monthlyUsage as mockMonthlyUsage,
  departmentUsage,
  decommissionedPrinters,
} from "./data/printers";
import { ACCOUNTS, type Account } from "./data/accounts";
import { loadRealPrinters } from "./lib/fetchPrinters";
import { loadMonthlyReport, mergeMonthlyReport } from "./lib/fetchMonthlyReport";
import { deriveAlerts, deriveGlobalToner } from "./lib/deriveFromPrinters";
import { DEFAULT_FILTERS, filterPrinters, type PrinterFilters } from "./lib/filterPrinters";
import { exportPrintersCsv } from "./lib/exportCsv";
import { useToast } from "./lib/toast";
import type { Alert, Printer } from "./types";

const AUTH_KEY = "elgin_auth_email";

function readStoredAccount(): Account | null {
  const email = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY);
  return ACCOUNTS.find((a) => a.email === email) ?? null;
}

const COMING_SOON: Record<string, { icon: typeof FileBarChart2; title: string; description: string }> = {
  network: { icon: Network, title: "Mapeamento de Rede", description: "A topologia visual da rede de impressão chega em breve." },
  users: { icon: UserCog, title: "Usuários", description: "Gestão de contas e permissões de acesso chega em breve." },
  notifications: { icon: Bell, title: "Notificações", description: "Preferências de alerta por e-mail e Teams chegam em breve." },
  integrations: { icon: Plug, title: "Integrações", description: "Conecte o painel a outras ferramentas em breve." },
  settings: { icon: Settings, title: "Configurações", description: "Preferências gerais do painel chegam em breve." },
};

export default function App() {
  const [account, setAccount] = useState<Account | null>(readStoredAccount);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rawPrinters, setRawPrinters] = useState<Printer[]>(mockPrinters);
  const [usingRealData, setUsingRealData] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<Awaited<ReturnType<typeof loadMonthlyReport>>>(null);
  const [filters, setFilters] = useState<PrinterFilters>(DEFAULT_FILTERS);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(() => new Date());
  const [initialLoading, setInitialLoading] = useState(true);
  const { push } = useToast();

  // Impressoras de fato usadas pela UI: base (mock ou real) + monthlyPages
  // do relatório mensal real, quando disponível. Derivado (não é estado)
  // para não depender da ordem em que os dois fetches abaixo terminam.
  const printers = useMemo(() => mergeMonthlyReport(rawPrinters, monthlyReport), [rawPrinters, monthlyReport]);
  const monthlyUsage = monthlyReport && monthlyReport.monthlyUsage.length > 0 ? monthlyReport.monthlyUsage : mockMonthlyUsage;
  const usingRealMonthlyReport = !!monthlyReport && monthlyReport.monthlyUsage.length > 0;

  useEffect(() => {
    let cancelled = false;
    const printersDone = loadRealPrinters().then((real) => {
      if (!cancelled && real) {
        setRawPrinters(real);
        setUsingRealData(true);
      }
    });
    // Relatório mensal real (scripts/Relatorio-Mensal.ps1) é independente do
    // coletor de status/toner acima — só existe depois que o script mensal
    // rodou pelo menos duas vezes. Enquanto isso, fica no mockMonthlyUsage.
    const reportDone = loadMonthlyReport().then((report) => {
      if (!cancelled && report) setMonthlyReport(report);
    });
    // Skeleton de carregamento inicial: some assim que os dois fetches
    // decidirem (real ou fallback pro mock), com um piso mínimo pra não
    // "piscar" quando a resposta vem instantânea demais.
    Promise.allSettled([printersDone, reportDone, new Promise((r) => window.setTimeout(r, 400))]).then(() => {
      if (!cancelled) setInitialLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = printers.length;
    const online = printers.filter((p) => p.status === "online").length;
    const offline = printers.filter((p) => p.status === "offline").length;
    const attention = printers.filter((p) => p.status === "atencao").length;
    return { total, online, offline, attention };
  }, [printers]);

  const alerts = useMemo(() => deriveAlerts(printers), [printers]);
  const globalToner = useMemo(() => deriveGlobalToner(printers) ?? undefined, [printers]);
  const filteredPrinters = useMemo(() => filterPrinters(printers, filters), [printers, filters]);
  const departments = useMemo(() => Array.from(new Set(printers.map((p) => p.department))).sort(), [printers]);
  const worstPrinter = useMemo(() => {
    const withToner = printers.filter((p) => p.toner && p.toner.length > 0);
    if (withToner.length === 0) return null;
    return withToner.reduce((worst, p) => {
      const worstPct = Math.min(...worst.toner!.map((t) => t.percent));
      const pPct = Math.min(...p.toner!.map((t) => t.percent));
      return pPct < worstPct ? p : worst;
    });
  }, [printers]);

  function updateFilter<K extends keyof PrinterFilters>(key: K, value: PrinterFilters[K]) {
    setFilters((f) => ({ ...f, [key]: value }));
  }

  function handleLoginSuccess(loggedInAccount: Account, remember: boolean) {
    if (remember) localStorage.setItem(AUTH_KEY, loggedInAccount.email);
    else sessionStorage.setItem(AUTH_KEY, loggedInAccount.email);
    setAccount(loggedInAccount);
  }

  function handleLogout() {
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    setAccount(null);
  }

  async function handleScan() {
    setScanning(true);
    const started = Date.now();
    const real = await loadRealPrinters();
    const elapsed = Date.now() - started;
    if (elapsed < 1100) await new Promise((r) => window.setTimeout(r, 1100 - elapsed));

    if (real) {
      setRawPrinters(real);
      setUsingRealData(true);
      push({ variant: "success", title: "Rede escaneada", description: `${real.length} impressora(s) encontrada(s) nos servidores.` });
    } else {
      push({
        variant: "info",
        title: "Nenhum coletor conectado",
        description: "Exibindo dados de demonstração. Rode scripts/Coletar-Impressoras.ps1 para dados reais.",
      });
    }
    setLastChecked(new Date());
    setScanning(false);
  }

  function handleAlertSelect(alert: Alert) {
    const printer = printers.find((p) => p.id === alert.printerId);
    if (printer) setSelectedPrinter(printer);
  }

  function handleNavigate(id: string) {
    setActiveNav(id);
    setMobileMenuOpen(false);
  }

  if (!account) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  const stub = COMING_SOON[activeNav];

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar
        active={activeNav}
        onNavigate={handleNavigate}
        alertCount={alerts.length}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        filters={filters}
        onFilterChange={updateFilter}
        departments={departments}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          account={account}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          alerts={alerts}
          query={filters.query}
          onQueryChange={(v) => updateFilter("query", v)}
          onExportCsv={() => {
            exportPrintersCsv(filteredPrinters);
            push({ variant: "success", title: "CSV exportado", description: `${filteredPrinters.length} impressora(s) incluída(s) no arquivo.` });
          }}
          onScan={handleScan}
          scanning={scanning}
          onLogout={handleLogout}
          onSelectAlert={handleAlertSelect}
        />

        <main className="flex-1 px-5 py-6 sm:px-8">
        <div key={activeNav} className="animate-view-in space-y-5">
          {activeNav === "dashboard" && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-faint">
                <p>
                  Última verificação: <span className="font-semibold text-ink-soft">{lastChecked.toLocaleTimeString("pt-BR")}</span>
                </p>
                <button
                  onClick={handleScan}
                  disabled={scanning}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 font-semibold text-brand-700 transition-colors hover:bg-brand-tint disabled:opacity-60"
                >
                  <RefreshCw size={13} className={scanning ? "animate-spin" : ""} />
                  {scanning ? "Verificando..." : "Verificar agora"}
                </button>
              </div>

              {initialLoading ? (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="h-[124px] animate-pulse rounded-2xl border border-border bg-surface-2" />
                  ))}
                </div>
              ) : (
                <StatCards
                  total={stats.total}
                  online={stats.online}
                  offline={stats.offline}
                  attention={stats.attention}
                  activeStatus={filters.status === "Todos" ? "Todos" : filters.status}
                  onSelectStatus={(s) => updateFilter("status", s)}
                />
              )}

              {!initialLoading && alerts.length > 0 && (
                <AlertBanner alerts={alerts} onViewAll={() => setActiveNav("alerts")} onSelectAlert={handleAlertSelect} />
              )}

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_296px]">
                {initialLoading ? (
                  <div className="h-[520px] animate-pulse rounded-2xl border border-border bg-surface-2" />
                ) : (
                  <PrinterTable
                    printers={filteredPrinters}
                    totalCount={printers.length}
                    filters={filters}
                    onFilterChange={updateFilter}
                    onOpenDetails={setSelectedPrinter}
                    compact
                  />
                )}
                <RightPanel
                  alertCount={alerts.length}
                  globalToner={globalToner}
                  worstPrinter={worstPrinter}
                  onOpenDetails={setSelectedPrinter}
                  onNavigate={setActiveNav}
                />
              </div>

              <BottomCharts
                attention={stats.attention}
                total={stats.total}
                monthlyUsage={monthlyUsage}
                onViewAlerts={() => setActiveNav("alerts")}
              />
            </>
          )}

          {activeNav === "printers" && (
            <PrinterTable
              printers={filteredPrinters}
              totalCount={printers.length}
              filters={filters}
              onFilterChange={updateFilter}
              onOpenDetails={setSelectedPrinter}
            />
          )}

          {activeNav === "toner" && (
            <TonerMonitoring
              printers={filteredPrinters}
              onOpenDetails={setSelectedPrinter}
              lastChecked={lastChecked}
              onRefresh={handleScan}
              refreshing={scanning}
            />
          )}

          {activeNav === "alerts" && (
            <AlertsView alerts={alerts} printers={printers} onSelectPrinter={setSelectedPrinter} />
          )}

          {activeNav === "reports" && (
            <>
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-ink">Relatório de Impressoras</h2>
                    <p className="text-sm text-ink-faint">Resumo da frota — {printers.length} equipamentos monitorados.</p>
                  </div>
                  <button
                    onClick={() => {
                      exportPrintersCsv(printers);
                      push({ variant: "success", title: "CSV exportado", description: `${printers.length} impressora(s) incluída(s) no arquivo.` });
                    }}
                    className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
                  >
                    <Download size={16} />
                    Exportar relatório (CSV)
                  </button>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-xl bg-surface-2 p-4">
                    <p className="text-xs font-semibold text-ink-faint">TOTAL</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">{stats.total}</p>
                  </div>
                  <div className="rounded-xl bg-success-tint p-4">
                    <p className="text-xs font-semibold text-success">ONLINE</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">{stats.online}</p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-4">
                    <p className="text-xs font-semibold text-ink-faint">OFFLINE</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">{stats.offline}</p>
                  </div>
                  <div className="rounded-xl bg-warning-tint p-4">
                    <p className="text-xs font-semibold text-warning">ATENÇÃO</p>
                    <p className="mt-1 text-2xl font-extrabold text-ink">{stats.attention}</p>
                  </div>
                </div>
              </div>

              <MonthlyCounters data={monthlyUsage} />
              <PrinterRanking printers={printers} onOpenDetails={setSelectedPrinter} />
              <DepartmentBreakdown data={departmentUsage} />
              <DecommissionedList data={decommissionedPrinters} />
            </>
          )}

          {activeNav === "history" && <HistoryMatrix printers={printers} />}

          {stub && <ComingSoon icon={stub.icon} title={stub.title} description={stub.description} />}
        </div>
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-border px-5 py-5 text-xs text-ink-faint sm:flex-row sm:px-8">
          <p>Elgin Impressoras © 2026 — Todos os direitos reservados</p>
          <div className="flex items-center gap-4">
            <p className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${usingRealData ? "bg-success" : "bg-ink-faint"}`} />
              {usingRealData ? "Conectado ao servidor" : "Modo demonstração (dados fictícios)"}
            </p>
            <p className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${usingRealMonthlyReport ? "bg-success" : "bg-ink-faint"}`} />
              {usingRealMonthlyReport ? "Relatório mensal real" : "Relatório mensal de demonstração"}
            </p>
          </div>
        </footer>
      </div>

      <PrinterDetailsModal printer={selectedPrinter} onClose={() => setSelectedPrinter(null)} />

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Central de Ajuda" subtitle="Estamos aqui para ajudar">
        <div className="flex flex-col gap-3">
          <a
            href="mailto:ti@elgin.com.br"
            className="flex items-center gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-surface-2"
          >
            <Mail size={18} className="text-brand-700" />
            <div>
              <p className="text-sm font-semibold text-ink">Enviar e-mail para o suporte</p>
              <p className="text-xs text-ink-faint">ti@elgin.com.br</p>
            </div>
          </a>
          <button
            onClick={() => {
              setHelpOpen(false);
              push({ variant: "info", title: "Chat indisponível", description: "O chat de suporte ao vivo chega em breve." });
            }}
            className="flex items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-surface-2"
          >
            <MessageCircle size={18} className="text-brand-700" />
            <div>
              <p className="text-sm font-semibold text-ink">Abrir chat de suporte</p>
              <p className="text-xs text-ink-faint">Em breve</p>
            </div>
          </button>
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4">
            <LifeBuoy size={18} className="text-ink-faint" />
            <p className="text-xs text-ink-soft">
              Script de coleta e documentação em <code className="rounded bg-surface-sunken px-1 py-0.5">scripts/Coletar-Impressoras.ps1</code>.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
