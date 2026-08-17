/**
 * Dependências externas: react (useMemo/useState), lucide-react (ícones).
 * Dependências locais: PrinterStatusBadge, lib/tonerColor (cor por canal e
 * por faixa de nível), lib/theme (canal K muda de tom no escuro), lib/toast.
 *
 * Área dedicada ao propósito central do sistema: acompanhar o nível de toner
 * de toda a frota num único lugar, com classificação (crítico/baixo/normal),
 * contagem por faixa e a possibilidade de forçar uma nova verificação — sem
 * precisar abrir impressora por impressora. As faixas usam os mesmos limiares
 * de lib/tonerColor.tonerLevelColor (≤15% crítico, ≤35% baixo) pra bater com
 * a cor mostrada em qualquer outro lugar do app.
 */
import { useMemo, useState } from "react";
import { AlertTriangle, CircleCheck, Droplet, RefreshCw, Search, WifiOff } from "lucide-react";
import type { Printer, TonerLevel } from "../types";
import PrinterStatusBadge from "./PrinterStatusBadge";
import { tonerChannelColor, tonerLevelColor } from "../lib/tonerColor";
import { useTheme } from "../lib/theme";

type TonerClass = "critical" | "warning" | "normal" | "none";

function classify(toner: TonerLevel[] | null): TonerClass {
  if (!toner || toner.length === 0) return "none";
  const worst = Math.min(...toner.map((t) => t.percent));
  if (worst <= 15) return "critical";
  if (worst <= 35) return "warning";
  return "normal";
}

const FILTERS: { value: "todos" | TonerClass; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "critical", label: "Crítico" },
  { value: "warning", label: "Baixo" },
  { value: "normal", label: "Normal" },
  { value: "none", label: "Sem dados" },
];

interface SummaryCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "critical" | "warning" | "success" | "faint";
  active: boolean;
  onClick: () => void;
}

const TONE = {
  critical: "bg-critical-tint text-critical",
  warning: "bg-warning-tint text-warning",
  success: "bg-success-tint text-success",
  faint: "bg-surface-2 text-ink-faint",
};

function SummaryCard({ label, value, icon, tone, active, onClick }: SummaryCardProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3.5 rounded-2xl border bg-surface p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? "border-transparent ring-2 ring-brand/30" : "border-border"
      }`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE[tone]}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-2xl font-extrabold leading-none text-ink">{value}</p>
        <p className="mt-1 truncate text-[12.5px] font-semibold text-ink-soft">{label}</p>
      </div>
    </button>
  );
}

interface TonerMonitoringProps {
  printers: Printer[];
  onOpenDetails: (printer: Printer) => void;
  lastChecked: Date;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function TonerMonitoring({ printers, onOpenDetails, lastChecked, onRefresh, refreshing }: TonerMonitoringProps) {
  const { theme } = useTheme();
  const [filter, setFilter] = useState<"todos" | TonerClass>("todos");
  const [query, setQuery] = useState("");

  const classified = useMemo(() => printers.map((p) => ({ printer: p, cls: classify(p.toner) })), [printers]);

  const counts = useMemo(() => {
    const c = { critical: 0, warning: 0, normal: 0, none: 0 };
    for (const { cls } of classified) c[cls]++;
    return c;
  }, [classified]);

  const offlineCount = useMemo(() => printers.filter((p) => p.status === "offline").length, [printers]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return classified
      .filter(({ cls }) => filter === "todos" || cls === filter)
      .filter(({ printer }) => !q || printer.name.toLowerCase().includes(q) || printer.ip.toLowerCase().includes(q))
      .sort((a, b) => {
        const order: Record<TonerClass, number> = { critical: 0, warning: 1, none: 2, normal: 3 };
        if (order[a.cls] !== order[b.cls]) return order[a.cls] - order[b.cls];
        const aWorst = a.printer.toner ? Math.min(...a.printer.toner.map((t) => t.percent)) : 999;
        const bWorst = b.printer.toner ? Math.min(...b.printer.toner.map((t) => t.percent)) : 999;
        return aWorst - bWorst;
      });
  }, [classified, filter, query]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
            <Droplet size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-ink">Monitoramento de Toner</h2>
            <p className="text-sm text-ink-faint">Nível de suprimento de toda a frota, atualizado em tempo real.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1.5">
          <p className="text-xs text-ink-faint">
            Última verificação: <span className="font-semibold text-ink-soft">{lastChecked.toLocaleTimeString("pt-BR")}</span>
          </p>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3.5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-sunken disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Verificando..." : "Atualizar agora"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          label="Toner crítico (≤15%)"
          value={counts.critical}
          icon={<AlertTriangle size={19} />}
          tone="critical"
          active={filter === "critical"}
          onClick={() => setFilter(filter === "critical" ? "todos" : "critical")}
        />
        <SummaryCard
          label="Toner baixo (≤35%)"
          value={counts.warning}
          icon={<Droplet size={19} />}
          tone="warning"
          active={filter === "warning"}
          onClick={() => setFilter(filter === "warning" ? "todos" : "warning")}
        />
        <SummaryCard
          label="Normal (>35%)"
          value={counts.normal}
          icon={<CircleCheck size={19} />}
          tone="success"
          active={filter === "normal"}
          onClick={() => setFilter(filter === "normal" ? "todos" : "normal")}
        />
        <SummaryCard
          label="Sem comunicação"
          value={offlineCount}
          icon={<WifiOff size={19} />}
          tone="faint"
          active={false}
          onClick={() => {}}
        />
      </div>

      <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                  filter === f.value ? "bg-brand text-white" : "bg-surface-2 text-ink-soft hover:bg-surface-sunken"
                }`}
              >
                {f.label}
                {f.value !== "todos" && ` (${counts[f.value]})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-ink-faint">
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou IP..."
              className="w-44 bg-transparent text-ink placeholder:text-ink-faint focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Impressora</th>
                <th className="px-3 py-3">IP</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Níveis de toner</th>
                <th className="px-3 py-3">Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ printer: p, cls }) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenDetails(p)}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-surface-2"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      {cls === "critical" && <AlertTriangle size={14} className="shrink-0 text-critical" />}
                      <div>
                        <p className="font-semibold text-ink">{p.name}</p>
                        <p className="text-[12px] text-ink-faint">{p.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-ink-soft">{p.ip}</td>
                  <td className="px-3 py-3.5">
                    <PrinterStatusBadge status={p.status} />
                  </td>
                  <td className="px-3 py-3.5">
                    {p.toner && p.toner.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        {p.toner.map((t) => (
                          <div key={t.color} className="flex items-center gap-1.5" title={`${t.label}: ${t.percent}%`}>
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tonerChannelColor(t.color, theme) }} />
                            <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-sunken">
                              <div className="h-full rounded-full" style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }} />
                            </div>
                            <span className="text-[12.5px] font-semibold" style={{ color: tonerLevelColor(t.percent) }}>
                              {t.percent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-ink-faint">Sem leitura de toner</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5 text-ink-soft">{p.lastSeen}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-ink-faint">
                    Nenhuma impressora encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-3 text-[12px] text-ink-faint">
          Mostrando {rows.length} de {printers.length} impressoras
        </div>
      </div>
    </div>
  );
}
