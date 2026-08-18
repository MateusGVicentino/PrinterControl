// Dependência externa: só lucide-react (ícone de alerta no status "atencao").
import { TriangleAlert } from "lucide-react";
import type { PrinterStatus } from "../types";
import { cn } from "../lib/cn";
import styles from "./PrinterStatusBadge.module.css";

const config: Record<PrinterStatus, { label: string; dot: string; text: string; bg: string }> = {
  online: { label: "Online", dot: styles.dotSuccess, text: styles.textSuccess, bg: styles.bgSuccess },
  offline: { label: "Offline", dot: styles.dotFaint, text: styles.textSoft, bg: styles.bgSurface },
  atencao: { label: "Atenção", dot: styles.dotWarning, text: styles.textWarning, bg: styles.bgWarning },
};

export default function PrinterStatusBadge({ status }: { status: PrinterStatus }) {
  const c = config[status];
  return (
    <span className={cn(styles.badge, c.text, c.bg)}>
      {status === "atencao" ? (
        <TriangleAlert size={12} />
      ) : (
        <span className={cn(styles.dot, c.dot, status === "online" && "animate-pulse")} />
      )}
      {c.label}
    </span>
  );
}
