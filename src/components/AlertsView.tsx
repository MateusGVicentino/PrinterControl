// Dependência externa: react (useState), lucide-react (ícones). Tela cheia
// de alertas (rota "alerts" em App.tsx) — mesma fonte de dados que AlertBanner.
import { useMemo, useState } from "react";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
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
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Alertas</h2>
          <p className="text-sm text-ink-faint">{alerts.length} alerta(s) ativo(s) na sua rede</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSeverityFilter("todos")}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              severityFilter === "todos" ? "bg-brand text-white" : "bg-surface-2 text-ink-soft hover:bg-surface-sunken"
            }`}
          >
            Todos ({alerts.length})
          </button>
          <button
            onClick={() => setSeverityFilter("critical")}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              severityFilter === "critical" ? "bg-critical text-white" : "bg-critical-tint text-critical hover:opacity-80"
            }`}
          >
            Crítico ({counts.critical})
          </button>
          <button
            onClick={() => setSeverityFilter("warning")}
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              severityFilter === "warning" ? "bg-warning text-white" : "bg-warning-tint text-warning hover:opacity-80"
            }`}
          >
            Atenção ({counts.warning})
          </button>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <CheckCircle2 size={32} className="text-success" />
          <p className="mt-4 text-sm font-semibold text-ink">Tudo certo por aqui</p>
          <p className="mt-1 text-sm text-ink-faint">Nenhuma impressora precisa de atenção no momento.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-sm text-ink-faint">Nenhum alerta nessa categoria.</p>
        </div>
      ) : (
        <ul>
          {visible.map((a) => {
            const printer = printers.find((p) => p.id === a.printerId);
            return (
              <li key={a.id} className="border-b border-border last:border-0">
                <button
                  onClick={() => printer && onSelectPrinter(printer)}
                  disabled={!printer}
                  className="flex w-full items-start gap-3.5 px-5 py-4 text-left transition-colors hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      a.severity === "critical" ? "bg-critical-tint text-critical" : "bg-warning-tint text-warning"
                    }`}
                  >
                    <TriangleAlert size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink">{a.message}</p>
                    <p className="mt-1 text-xs text-ink-faint">{a.timestamp}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      a.severity === "critical" ? "bg-critical-tint text-critical" : "bg-warning-tint text-warning"
                    }`}
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
