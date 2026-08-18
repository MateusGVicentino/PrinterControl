"use client";

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
import { cn } from "../lib/cn";
import styles from "./TonerMonitoring.module.css";

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
  critical: styles.toneCritical,
  warning: styles.toneWarning,
  success: styles.toneSuccess,
  faint: styles.toneFaint,
};

function SummaryCard({ label, value, icon, tone, active, onClick }: SummaryCardProps) {
  return (
    <button onClick={onClick} className={cn(styles.summaryCard, active && styles.summaryCardActive)}>
      <div className={cn(styles.summaryIcon, TONE[tone])}>{icon}</div>
      <div className={styles.summaryTextWrap}>
        <p className={styles.summaryValue}>{value}</p>
        <p className={styles.summaryLabel}>{label}</p>
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
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Droplet size={20} />
          </div>
          <div>
            <h2 className={styles.headerTitle}>Monitoramento de Toner</h2>
            <p className={styles.headerSubtitle}>Nível de suprimento de toda a frota, atualizado em tempo real.</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <p className={styles.lastChecked}>
            Última verificação: <span className={styles.lastCheckedValue}>{lastChecked.toLocaleTimeString("pt-BR")}</span>
          </p>
          <button onClick={onRefresh} disabled={refreshing} className={styles.refreshButton}>
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Verificando..." : "Atualizar agora"}
          </button>
        </div>
      </div>

      <div className={styles.summaryGrid}>
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

      <div className={styles.tableCard}>
        <div className={styles.filterBar}>
          <div className={styles.filterPills}>
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(styles.filterPill, filter === f.value ? styles.filterPillActive : styles.filterPillInactive)}
              >
                {f.label}
                {f.value !== "todos" && ` (${counts[f.value]})`}
              </button>
            ))}
          </div>
          <div className={styles.searchBox}>
            <Search size={15} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nome ou IP..."
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.thFirst}>Impressora</th>
                <th className={styles.th}>IP</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Níveis de toner</th>
                <th className={styles.th}>Última atividade</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ printer: p, cls }) => (
                <tr key={p.id} onClick={() => onOpenDetails(p)} className={styles.row}>
                  <td className={styles.tdFirst}>
                    <div className={styles.nameCell}>
                      {cls === "critical" && <AlertTriangle size={14} className={styles.criticalIcon} />}
                      <div>
                        <p className={styles.printerName}>{p.name}</p>
                        <p className={styles.printerDept}>{p.department}</p>
                      </div>
                    </div>
                  </td>
                  <td className={styles.tdSoft}>{p.ip}</td>
                  <td className={styles.td}>
                    <PrinterStatusBadge status={p.status} />
                  </td>
                  <td className={styles.td}>
                    {p.toner && p.toner.length > 0 ? (
                      <div className={styles.tonerList}>
                        {p.toner.map((t) => (
                          <div key={t.color} className={styles.tonerItem} title={`${t.label}: ${t.percent}%`}>
                            <span className={styles.tonerDot} style={{ backgroundColor: tonerChannelColor(t.color, theme) }} />
                            <div className={styles.tonerBarTrack}>
                              <div className={styles.tonerBarFill} style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }} />
                            </div>
                            <span className={styles.tonerPercent} style={{ color: tonerLevelColor(t.percent) }}>
                              {t.percent}%
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className={styles.noToner}>Sem leitura de toner</span>
                    )}
                  </td>
                  <td className={styles.tdSoft}>{p.lastSeen}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className={styles.emptyCell}>
                    Nenhuma impressora encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.footer}>
          Mostrando {rows.length} de {printers.length} impressoras
        </div>
      </div>
    </div>
  );
}
