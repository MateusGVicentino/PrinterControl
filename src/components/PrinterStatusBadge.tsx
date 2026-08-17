// Dependência externa: só lucide-react (ícone de alerta no status "atencao").
import { TriangleAlert } from "lucide-react";
import type { PrinterStatus } from "../types";

const config: Record<PrinterStatus, { label: string; dot: string; text: string; bg: string }> = {
  online: { label: "Online", dot: "bg-success", text: "text-success", bg: "bg-success-tint" },
  offline: { label: "Offline", dot: "bg-ink-faint", text: "text-ink-soft", bg: "bg-surface-2" },
  atencao: { label: "Atenção", dot: "bg-warning", text: "text-warning", bg: "bg-warning-tint" },
};

export default function PrinterStatusBadge({ status }: { status: PrinterStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium ${c.text} ${c.bg}`}>
      {status === "atencao" ? (
        <TriangleAlert size={12} />
      ) : (
        <span className={`h-2 w-2 rounded-full ${c.dot} ${status === "online" ? "animate-pulse" : ""}`} />
      )}
      {c.label}
    </span>
  );
}
