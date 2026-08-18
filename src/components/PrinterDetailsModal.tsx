"use client";

/**
 * Dependências externas: react (useEffect/useState, para o mês selecionado
 * no gráfico) e lucide-react (ícones). Dependências locais: Modal (casca
 * genérica), PrinterStatusBadge, lib/tonerColor (cores por canal/nível).
 * O bloco "Impressões por mês" lê printer.monthlyPages — populado a partir
 * da planilha em modo demo, ou de /data/monthly-report.json em produção
 * (ver lib/fetchMonthlyReport.ts e scripts/Relatorio-Mensal.ps1).
 */
import { useEffect, useState } from "react";
import { ExternalLink, FileText, Lightbulb, Printer as PrinterIcon } from "lucide-react";
import type { Printer } from "../types";
import Modal from "./Modal";
import PrinterStatusBadge from "./PrinterStatusBadge";
import { tonerChannelColor, tonerLevelColor } from "../lib/tonerColor";
import { useToast } from "../lib/toast";
import { useTheme } from "../lib/theme";
import { cn } from "../lib/cn";
import styles from "./PrinterDetailsModal.module.css";

interface PrinterDetailsModalProps {
  printer: Printer | null;
  onClose: () => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className={styles.factLabel}>{label}</p>
      <p className={styles.factValue}>{value}</p>
    </div>
  );
}

export default function PrinterDetailsModal({ printer, onClose }: PrinterDetailsModalProps) {
  const { push } = useToast();
  const { theme } = useTheme();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMonth(null);
  }, [printer?.id]);

  if (!printer) return null;

  const lowest = printer.toner ? [...printer.toner].sort((a, b) => a.percent - b.percent)[0] : null;
  const needsAttention = lowest && lowest.percent <= 20;
  const monthly = printer.monthlyPages ?? [];
  const activeMonth = monthly.find((m) => m.month === selectedMonth) ?? monthly[monthly.length - 1] ?? null;
  const maxMonthPages = Math.max(1, ...monthly.map((m) => m.pages));

  function handleTestPage() {
    push({
      variant: "success",
      title: "Página de teste enviada",
      description: `Um job de impressão foi enfileirado para ${printer!.name}.`,
    });
    onClose();
  }

  return (
    <Modal
      open={!!printer}
      onClose={onClose}
      title={printer.name}
      subtitle={printer.model}
      maxWidth="36rem"
      footer={
        <>
          <button onClick={handleTestPage} className={styles.footerButton}>
            <FileText size={16} />
            Imprimir página de teste
          </button>
          <a href={`http://${printer.ip}`} target="_blank" rel="noreferrer" className={styles.footerLink}>
            <ExternalLink size={16} />
            Acessar via web
          </a>
        </>
      }
    >
      <div className={styles.summary}>
        <div className={styles.summaryIcon}>
          <PrinterIcon size={20} />
        </div>
        <div className={styles.summaryText}>
          <p className={styles.summaryIp}>{printer.ip}</p>
          <p className={styles.summaryDept}>{printer.department}</p>
        </div>
        <PrinterStatusBadge status={printer.status} />
      </div>

      <div className={styles.factsGrid}>
        <Fact label="Páginas impressas (período)" value={printer.pagesPrinted.toLocaleString("pt-BR")} />
        <Fact label="Última atividade" value={printer.lastSeen} />
        <Fact label="Endereço IP" value={printer.ip} />
      </div>

      {monthly.length > 0 && (
        <div className={styles.monthlyCard}>
          <div className={styles.monthlyHeader}>
            <p className={styles.factLabel}>Impressões por mês</p>
            {activeMonth && (
              <span className={styles.monthlyBadge}>
                {activeMonth.month}: {activeMonth.pages.toLocaleString("pt-BR")}
              </span>
            )}
          </div>
          {activeMonth && <p className={styles.monthlyPeriod}>Período: {activeMonth.period}</p>}
          <div className={styles.monthlyBars}>
            {monthly.map((m) => {
              const active = activeMonth?.month === m.month;
              return (
                <button
                  key={m.month}
                  onClick={() => setSelectedMonth(m.month)}
                  className={styles.monthlyBarButton}
                  title={`${m.month}: ${m.pages.toLocaleString("pt-BR")} páginas`}
                >
                  <span className={cn(styles.monthlyBarLabel, active ? styles.monthlyBarLabelActive : styles.monthlyBarLabelInactive)}>
                    {m.pages > 999 ? `${Math.round(m.pages / 1000)}k` : m.pages}
                  </span>
                  <div
                    className={cn(styles.monthlyBar, active ? styles.monthlyBarActive : styles.monthlyBarInactive)}
                    style={{ height: `${8 + (m.pages / maxMonthPages) * 64}px` }}
                  />
                  <span className={cn(styles.monthlyBarMonth, active ? styles.monthlyBarMonthActive : styles.monthlyBarMonthInactive)}>
                    {m.month}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {printer.toner && printer.toner.length > 0 && (
        <div className={styles.supplySection}>
          <p className={styles.factLabel}>Níveis de suprimento</p>
          <div className={styles.supplyList}>
            {printer.toner.map((t) => (
              <div key={t.color}>
                <div className={styles.supplyRow}>
                  <span className={styles.supplyLabel}>{t.label}</span>
                  <span className={styles.supplyPercent} style={{ color: tonerLevelColor(t.percent) }}>
                    {t.percent}%
                  </span>
                </div>
                <div className={styles.supplyTrack}>
                  <div className={styles.supplyFill} style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {needsAttention && lowest && (
        <div className={styles.recommendation}>
          <Lightbulb size={18} className={styles.recommendationIcon} />
          <div>
            <p className={styles.recommendationTitle}>Recomendação</p>
            <p className={styles.recommendationText}>
              O nível de {lowest.label.toLowerCase()} está em {lowest.percent}%. Programe a troca do cartucho
              nos próximos dias para evitar interrupção no departamento {printer.department}.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
