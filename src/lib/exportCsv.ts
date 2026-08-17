/**
 * Sem libs externas. Gera CSV client-side (Blob + <a download>) — funciona
 * no app real, mas NÃO num Artifact/preview sandboxado (link de download é
 * bloqueado lá; o preview usa a capability `downloads` do Claude em vez disso).
 */
import type { Printer } from "../types";

const STATUS_LABEL: Record<Printer["status"], string> = {
  online: "Online",
  offline: "Offline",
  atencao: "Atenção",
};

export function exportPrintersCsv(printers: Printer[]) {
  const header = ["Nome", "IP", "Modelo", "Departamento", "Status", "Toner", "Páginas Impressas", "Última Atividade"];
  const rows = printers.map((p) => [
    p.name,
    p.ip,
    p.model,
    p.department,
    STATUS_LABEL[p.status],
    p.toner ? p.toner.map((t) => `${t.label}: ${t.percent}%`).join(" | ") : "N/A",
    String(p.pagesPrinted),
    p.lastSeen,
  ]);

  const escape = (value: string) => (/[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const csv = [header, ...rows].map((row) => row.map(escape).join(";")).join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-T:]/g, "");
  a.href = url;
  a.download = `impressoras-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
