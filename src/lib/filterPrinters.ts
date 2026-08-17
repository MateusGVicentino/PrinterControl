/**
 * Sem libs externas. `PrinterFilters` é o estado compartilhado que dirige
 * Sidebar (pills), StatCards (clique nos cards) e PrinterTable (busca +
 * filtro inline) ao mesmo tempo — fica em App.tsx e desce via props.
 */
import type { Printer, PrinterStatus } from "../types";
import { getPrinterType, type PrinterType } from "./printerType";

export interface PrinterFilters {
  query: string;
  status: "Todos" | PrinterStatus;
  type: "Todos" | PrinterType;
  department: "Todos" | string;
}

export const DEFAULT_FILTERS: PrinterFilters = {
  query: "",
  status: "Todos",
  type: "Todos",
  department: "Todos",
};

export function filterPrinters(printers: Printer[], filters: PrinterFilters): Printer[] {
  const q = filters.query.trim().toLowerCase();
  return printers.filter((p) => {
    if (filters.status !== "Todos" && p.status !== filters.status) return false;
    if (filters.type !== "Todos" && getPrinterType(p) !== filters.type) return false;
    if (filters.department !== "Todos" && p.department !== filters.department) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.ip.includes(q) || p.model.toLowerCase().includes(q) || p.department.toLowerCase().includes(q))) {
      return false;
    }
    return true;
  });
}
