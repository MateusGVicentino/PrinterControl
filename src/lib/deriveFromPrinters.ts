/**
 * Sem libs externas. Deriva Alertas e o "pior toner por canal" a partir da
 * lista de impressoras — é a única fonte de alertas do app (não existe um
 * array de alertas separado guardado em estado; eles são sempre recalculados
 * a partir de printers, então nunca ficam dessincronizados).
 */
import type { Alert, Printer, TonerLevel } from "../types";

export function deriveAlerts(printers: Printer[]): Alert[] {
  const alerts: Alert[] = [];

  for (const p of printers) {
    if (!p.toner) continue;
    for (const t of p.toner) {
      if (t.percent <= 20) {
        alerts.push({
          id: `toner-${p.id}-${t.color}`,
          severity: t.percent <= 10 ? "critical" : "warning",
          message: `Toner baixo na impressora ${p.name} (${t.label.split(" ")[0]}: ${t.percent}%)`,
          printerId: p.id,
          timestamp: "agora",
        });
      }
    }
  }

  for (const p of printers) {
    if (p.status === "offline") {
      alerts.push({
        id: `offline-${p.id}`,
        severity: "warning",
        message: `${p.name} está offline`,
        printerId: p.id,
        timestamp: p.lastSeen,
      });
    }
  }

  return alerts.sort((a, b) => (a.severity === "critical" ? -1 : b.severity === "critical" ? 1 : 0));
}

export function deriveGlobalToner(printers: Printer[]): TonerLevel[] | null {
  const worst = new Map<TonerLevel["color"], TonerLevel>();

  for (const p of printers) {
    if (!p.toner) continue;
    for (const t of p.toner) {
      const current = worst.get(t.color);
      if (!current || t.percent < current.percent) {
        worst.set(t.color, t);
      }
    }
  }

  if (worst.size === 0) return null;

  const order: TonerLevel["color"][] = ["K", "C", "M", "Y"];
  return order.filter((c) => worst.has(c)).map((c) => worst.get(c)!);
}
