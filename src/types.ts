/**
 * Contratos de dados compartilhados entre frontend e os coletores PowerShell
 * (scripts/Coletar-Impressoras.ps1 e scripts/Relatorio-Mensal.ps1). Mudar um
 * campo aqui exige mudar o `ConvertTo-*Json` correspondente no script — são
 * a mesma "API" só que sem servidor no meio (arquivo JSON estático).
 */
export type PrinterStatus = "online" | "offline" | "atencao";

export interface TonerLevel {
  color: "K" | "C" | "M" | "Y";
  label: string;
  percent: number;
}

export interface MonthlyPageCount {
  month: string;
  pages: number;
  period: string;
}

export interface Printer {
  id: string;
  name: string;
  ip: string;
  model: string;
  department: string;
  status: PrinterStatus;
  toner: TonerLevel[] | null;
  pagesPrinted: number;
  lastSeen: string;
  monthlyPages?: MonthlyPageCount[];
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  printerId: string;
  timestamp: string;
}

export interface MonthlyUsage {
  month: string;
  pages: number;
}

export interface MonthlyUsageEntry extends MonthlyUsage {
  period: string;
}

/**
 * Shape written by scripts/Relatorio-Mensal.ps1 to public/data/monthly-report.json.
 * Optional/real: only present once that script has been deployed and scheduled —
 * see src/lib/fetchMonthlyReport.ts for the loader and its mock fallback.
 */
export interface MonthlyReport {
  generatedAt: string;
  monthlyUsage: MonthlyUsageEntry[];
  printers: {
    ip: string;
    name: string;
    department: string;
    monthlyPages: MonthlyPageCount[];
  }[];
}
