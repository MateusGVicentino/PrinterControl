/**
 * Sem libs externas. Classifica o tipo de impressora por regex no nome+modelo
 * (não existe campo "tipo" vindo do SNMP/Get-Printer) — mesma lógica do
 * NOC original (Main.ps1 → Obter-TipoImpressora), portada para TS aqui.
 */
import type { Printer } from "../types";

export type PrinterType = "A4" | "Etiqueta" | "Portatil";

export function getPrinterType(printer: Pick<Printer, "name" | "model">): PrinterType {
  const text = `${printer.name} ${printer.model}`;
  if (/zebra|elgin|tt042|argox/i.test(text)) return "Etiqueta";
  if (/honeywell|rp4f|sewoo|port[aá]til/i.test(text)) return "Portatil";
  return "A4";
}
