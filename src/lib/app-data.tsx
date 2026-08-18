/**
 * Estado compartilhado entre todas as rotas do painel — equivalente direto
 * do estado que antes vivia em App.tsx (SPA de página única) e descia via
 * props. Agora que a navegação usa rotas reais do Next.js, cada página é um
 * componente separado; este Context é o que permite que todas continuem
 * enxergando os mesmos dados (impressoras, filtros, conta logada, modal de
 * detalhes) sem re-buscar ou perder estado ao trocar de rota.
 *
 * Estado puramente de "chrome" (menu mobile aberto, modal de ajuda) continua
 * local ao AppShell — não precisa ser global.
 */
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  printers as mockPrinters,
  monthlyUsage as mockMonthlyUsage,
  departmentUsage,
  decommissionedPrinters,
} from "../data/printers";
import { ACCOUNTS, type Account } from "../data/accounts";
import { loadRealPrinters } from "./fetchPrinters";
import { loadMonthlyReport, mergeMonthlyReport } from "./fetchMonthlyReport";
import { deriveAlerts, deriveGlobalToner } from "./deriveFromPrinters";
import { DEFAULT_FILTERS, filterPrinters, type PrinterFilters } from "./filterPrinters";
import { useToast } from "./toast";
import type { Alert, Printer, TonerLevel } from "../types";

const AUTH_KEY = "elgin_auth_email";

function readStoredAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(AUTH_KEY) ?? sessionStorage.getItem(AUTH_KEY);
  return ACCOUNTS.find((a) => a.email === email) ?? null;
}

interface AppDataContextValue {
  account: Account | null;
  handleLoginSuccess: (loggedInAccount: Account, remember: boolean) => void;
  handleLogout: () => void;

  printers: Printer[];
  monthlyUsage: typeof mockMonthlyUsage;
  departmentUsage: typeof departmentUsage;
  decommissionedPrinters: typeof decommissionedPrinters;
  usingRealData: boolean;
  usingRealMonthlyReport: boolean;
  initialLoading: boolean;

  filters: PrinterFilters;
  updateFilter: <K extends keyof PrinterFilters>(key: K, value: PrinterFilters[K]) => void;
  filteredPrinters: Printer[];
  departments: string[];

  stats: { total: number; online: number; offline: number; attention: number };
  alerts: Alert[];
  globalToner: TonerLevel[] | undefined;
  worstPrinter: Printer | null;

  selectedPrinter: Printer | null;
  setSelectedPrinter: (printer: Printer | null) => void;
  handleAlertSelect: (alert: Alert) => void;

  scanning: boolean;
  lastChecked: Date;
  handleScan: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [rawPrinters, setRawPrinters] = useState<Printer[]>(mockPrinters);
  const [usingRealData, setUsingRealData] = useState(false);
  const [monthlyReport, setMonthlyReport] = useState<Awaited<ReturnType<typeof loadMonthlyReport>>>(null);
  const [filters, setFilters] = useState<PrinterFilters>(DEFAULT_FILTERS);
  const [selectedPrinter, setSelectedPrinter] = useState<Printer | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(() => new Date());
  const [initialLoading, setInitialLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    setAccount(readStoredAccount());
  }, []);

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

  const value: AppDataContextValue = {
    account,
    handleLoginSuccess,
    handleLogout,

    printers,
    monthlyUsage,
    departmentUsage,
    decommissionedPrinters,
    usingRealData,
    usingRealMonthlyReport,
    initialLoading,

    filters,
    updateFilter,
    filteredPrinters,
    departments,

    stats,
    alerts,
    globalToner,
    worstPrinter,

    selectedPrinter,
    setSelectedPrinter,
    handleAlertSelect,

    scanning,
    lastChecked,
    handleScan,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
