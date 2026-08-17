// Dependência externa: só lucide-react (ícones). `alerts` vem pronto de
// lib/deriveFromPrinters.ts — este componente só exibe, não calcula nada.
import { TriangleAlert, ChevronRight } from "lucide-react";
import type { Alert } from "../types";

interface AlertBannerProps {
  alerts: Alert[];
  onViewAll: () => void;
  onSelectAlert?: (alert: Alert) => void;
}

export default function AlertBanner({ alerts, onViewAll, onSelectAlert }: AlertBannerProps) {
  if (alerts.length === 0) return null;
  const top = alerts[0];

  return (
    <div className="overflow-hidden rounded-2xl border border-critical/20 bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-4 bg-critical-tint px-5 py-3.5">
        <div className="flex items-center gap-2">
          <TriangleAlert size={16} className="text-critical" />
          <h3 className="text-[13px] font-bold uppercase tracking-wide text-critical">Alertas importantes</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-critical px-1.5 text-[11px] font-bold text-white">
            {alerts.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="flex shrink-0 items-center gap-1 text-sm font-semibold text-critical/80 transition-colors hover:text-critical"
        >
          Ver todos
          <ChevronRight size={15} />
        </button>
      </div>
      <button
        onClick={() => onSelectAlert?.(top)}
        className="flex w-full items-center gap-2.5 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
      >
        <TriangleAlert size={16} className="shrink-0 text-warning" />
        <p className="text-sm text-ink-soft">{top.message}</p>
      </button>
    </div>
  );
}
