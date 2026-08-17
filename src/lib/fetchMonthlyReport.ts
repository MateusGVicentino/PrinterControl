/**
 * Dependências: nenhuma lib externa — só `fetch` nativo do browser e o tipo
 * `MonthlyReport` (src/types.ts). Sem imports de outros módulos locais.
 *
 * Carrega o relatório mensal real gerado por scripts/Relatorio-Mensal.ps1
 * (deployado em /data/monthly-report.json, ao lado do /data/printers.json
 * de Coletar-Impressoras.ps1). Enquanto esse script não estiver agendado em
 * produção, o fetch simplesmente falha/retorna null e a UI usa os números
 * extraídos da planilha (src/data/printers.ts) como demonstração.
 */
import type { MonthlyReport } from "../types";

function isValidReport(value: unknown): value is MonthlyReport {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return typeof r.generatedAt === "string" && Array.isArray(r.monthlyUsage) && Array.isArray(r.printers);
}

export async function loadMonthlyReport(): Promise<MonthlyReport | null> {
  try {
    const res = await fetch("/data/monthly-report.json", { cache: "no-store" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!isValidReport(data)) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Mescla o relatório mensal real (por IP) nos objetos Printer já carregados,
 * preenchendo/atualizando `monthlyPages`. Impressoras sem correspondência no
 * relatório (ainda sem histórico suficiente, ex.: primeira execução do
 * script) mantêm o que já tinham (ou ficam sem monthlyPages).
 */
export function mergeMonthlyReport<T extends { ip: string; monthlyPages?: unknown }>(
  printers: T[],
  report: MonthlyReport | null
): T[] {
  if (!report) return printers;
  const byIp = new Map(report.printers.map((p) => [p.ip, p.monthlyPages]));
  return printers.map((p) => {
    const monthlyPages = byIp.get(p.ip);
    return monthlyPages ? { ...p, monthlyPages } : p;
  });
}
