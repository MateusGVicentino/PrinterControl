/**
 * Sem libs externas — só `fetch` nativo. Ver também src/lib/fetchMonthlyReport.ts
 * (mesmo padrão, para o relatório mensal em vez do status/toner ao vivo).
 */
import type { Printer } from "../types";

function isValidPrinter(value: unknown): value is Printer {
  if (typeof value !== "object" || value === null) return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.ip === "string" &&
    typeof p.model === "string" &&
    typeof p.status === "string"
  );
}

/**
 * Loads real printer data collected by scripts/Coletar-Impressoras.ps1
 * (deployed to /data/printers.json). Returns null when that file isn't
 * present or doesn't parse, so callers can fall back to the demo mock.
 */
export async function loadRealPrinters(): Promise<Printer[] | null> {
  try {
    const res = await fetch("/data/printers.json", { cache: "no-store" });
    if (!res.ok) return null;

    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    if (!data.every(isValidPrinter)) return null;

    return data;
  } catch {
    return null;
  }
}
