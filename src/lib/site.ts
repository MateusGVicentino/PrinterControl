/**
 * Sem libs externas. `Printer["department"]` guarda "Departamento — Unidade"
 * (ver geração em data/printers.ts, a partir da planilha) — este arquivo só
 * separa as duas metades para telas que precisam agrupar por unidade
 * (Histórico) sem duplicar o campo no tipo Printer.
 */
import type { Printer } from "../types";

const SEPARATOR = " — ";

export function getPrinterSite(printer: Pick<Printer, "department">): string {
  const idx = printer.department.lastIndexOf(SEPARATOR);
  return idx === -1 ? "Outras unidades" : printer.department.slice(idx + SEPARATOR.length);
}

export function getDepartmentLabel(printer: Pick<Printer, "department">): string {
  const idx = printer.department.lastIndexOf(SEPARATOR);
  return idx === -1 ? printer.department : printer.department.slice(0, idx);
}
