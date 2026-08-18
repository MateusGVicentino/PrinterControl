/**
 * Dependência externa: lucide-react (ícones). `globalToner` (import de
 * data/printers.ts) é só o fallback default do prop — na prática o
 * AppDataProvider sempre passa o valor calculado por lib/deriveFromPrinters.ts,
 * então esse import raramente é o que renderiza de fato.
 */
"use client";

import { ChevronRight, TriangleAlert, FileBarChart2, History, PlusCircle, Settings, Bell } from "lucide-react";
import { globalToner as mockGlobalToner } from "../data/printers";
import { tonerChannelColor } from "../lib/tonerColor";
import { useToast } from "../lib/toast";
import { useTheme } from "../lib/theme";
import type { Printer, TonerLevel } from "../types";
import styles from "./RightPanel.module.css";

function QuickAction({
  icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className={styles.quickAction}>
      <span className={styles.quickActionIcon}>{icon}</span>
      <span className={styles.quickActionLabel}>{label}</span>
      {badge ? (
        <span className={styles.quickActionBadge}>{badge}</span>
      ) : (
        <ChevronRight size={15} className={styles.quickActionChevron} />
      )}
    </button>
  );
}

interface RightPanelProps {
  alertCount: number;
  globalToner?: TonerLevel[];
  worstPrinter: Printer | null;
  onOpenDetails: (printer: Printer) => void;
  onNavigate: (id: string) => void;
}

export default function RightPanel({ alertCount, globalToner = mockGlobalToner, worstPrinter, onOpenDetails, onNavigate }: RightPanelProps) {
  const { push } = useToast();
  const { theme } = useTheme();
  const critical = globalToner.find((t) => t.percent <= 20);

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Níveis de toner</h3>
        <div className={styles.tonerList}>
          {globalToner.map((t) => (
            <div key={t.color}>
              <div className={styles.tonerRowHeader}>
                <span className={styles.tonerLabel}>
                  <span className={styles.tonerDot} style={{ backgroundColor: tonerChannelColor(t.color, theme) }} />
                  {t.label}
                </span>
                <span className={styles.tonerPercentValue}>{t.percent}%</span>
              </div>
              <div className={styles.tonerBarWrap}>
                <div className={styles.tonerBarFill} style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => onNavigate("printers")} className={styles.detailsLink}>
          Ver detalhes
          <ChevronRight size={15} />
        </button>
      </div>

      {critical && (
        <div className={styles.criticalCard}>
          <div className={styles.criticalHeader}>
            <div className={styles.criticalIconWrap}>
              <TriangleAlert size={18} />
            </div>
            <div>
              <p className={styles.criticalLabel}>Toner baixo</p>
              <p className={styles.criticalValue}>{critical.percent}% restante</p>
            </div>
          </div>
          <p className={styles.criticalDesc}>Considere substituir em breve.</p>
          <button
            onClick={() => {
              if (worstPrinter) onOpenDetails(worstPrinter);
              else push({ variant: "info", title: "Sem impressora associada a este alerta ainda." });
            }}
            className={styles.criticalButton}
          >
            Ver Recomendações
          </button>
        </div>
      )}

      <div className={styles.card}>
        <h3 className={styles.quickActionsTitle}>Ações rápidas</h3>
        <div className={styles.quickActionsList}>
          <QuickAction icon={<FileBarChart2 size={17} />} label="Relatório de Impressoras" onClick={() => onNavigate("reports")} />
          <QuickAction icon={<History size={17} />} label="Histórico de Alertas" badge={alertCount} onClick={() => onNavigate("alerts")} />
          <QuickAction
            icon={<PlusCircle size={17} />}
            label="Adicionar Impressora"
            onClick={() => push({ variant: "info", title: "Em breve", description: "Cadastro manual de impressoras chega numa próxima versão." })}
          />
          <QuickAction icon={<Settings size={17} />} label="Configurações" onClick={() => onNavigate("settings")} />
          <QuickAction icon={<Bell size={17} />} label="Notificações" onClick={() => onNavigate("notifications")} />
        </div>
      </div>
    </div>
  );
}
