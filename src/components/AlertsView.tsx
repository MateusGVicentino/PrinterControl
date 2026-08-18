// Dependência externa: react (useState), lucide-react (ícones). Tela cheia
// de alertas (rota "alerts") — mesma fonte de dados que AlertBanner.
import { useMemo, useState } from "react";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/cn";
import styles from "./AlertsView.module.css";
import type { Alert, Printer } from "../types";

interface AlertsViewProps {
  alerts: Alert[];
  printers: Printer[];
  onSelectPrinter: (printer: Printer) => void;
}

export default function AlertsView({ alerts, printers, onSelectPrinter }: AlertsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<"todos" | Alert["severity"]>("todos");

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, info: 0 };
    for (const a of alerts) c[a.severity]++;
    return c;
  }, [alerts]);

  const visible = severityFilter === "todos" ? alerts : alerts.filter((a) => a.severity === severityFilter);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Alertas</h2>
          <p className={styles.subtitle}>{alerts.length} alerta(s) ativo(s) na sua rede</p>
        </div>
        <div className={styles.filters}>
          <button
            onClick={() => setSeverityFilter("todos")}
            className={cn(styles.filterBtn, severityFilter === "todos" && styles.filterBtnActive)}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter("critical")}
            className={cn(
              styles.filterBtnCritical,
              severityFilter === "critical" && styles.filterBtnCriticalActive
            )}
          >
            Crítico ({counts.critical})
          </button>
          <button
            onClick={() => setSeverityFilter("warning")}
            className={cn(
              styles.filterBtnWarning,
              severityFilter === "warning" && styles.filterBtnWarningActive
            )}
          >
            Atenção ({counts.warning})
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle2 size={32} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>Tudo certo por aqui</p>
          <p className={styles.emptyText}>Nenhuma impressora precisa de atenção no momento.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Nenhum alerta nessa categoria.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {visible.map((a) => {
            const printer = printers.find((p) => p.id === a.printerId);
            return (
              <li key={a.id} className={styles.listItem}>
                <button
                  onClick={() => printer && onSelectPrinter(printer)}
                  disabled={!printer}
                  className={styles.alertBtn}
                >
                  <div
                    className={cn(
                      styles.alertIcon,
                      a.severity === "critical" ? styles.alertIconCritical : styles.alertIconWarning
                    )}
                  >
                    <TriangleAlert size={16} />
                  </div>
                  <div className={styles.alertBody}>
                    <p className={styles.alertMessage}>{a.message}</p>
                    <p className={styles.alertTimestamp}>{a.timestamp}</p>
                  </div>
                  <span
                    className={cn(
                      styles.alertBadge,
                      a.severity === "critical" ? styles.alertBadgeCritical : styles.alertBadgeWarning
                    )}
                  >
                    {a.severity === "critical" ? "Crítico" : "Atenção"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
