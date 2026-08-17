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

interface PrinterDetailsModalProps {
  printer: Printer | null;
  onClose: () => void;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink">{value}</p>
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
      maxWidth="max-w-xl"
      footer={
        <>
          <button
            onClick={handleTestPage}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            <FileText size={16} />
            Imprimir página de teste
          </button>
          <a
            href={`http://${printer.ip}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600"
          >
            <ExternalLink size={16} />
            Acessar via web
          </a>
        </>
      }
    >
      <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
          <PrinterIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{printer.ip}</p>
          <p className="text-[13px] text-ink-soft">{printer.department}</p>
        </div>
        <PrinterStatusBadge status={printer.status} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Fact label="Páginas impressas (período)" value={printer.pagesPrinted.toLocaleString("pt-BR")} />
        <Fact label="Última atividade" value={printer.lastSeen} />
        <Fact label="Endereço IP" value={printer.ip} />
      </div>

      {monthly.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Impressões por mês</p>
            {activeMonth && (
              <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-700">
                {activeMonth.month}: {activeMonth.pages.toLocaleString("pt-BR")}
              </span>
            )}
          </div>
          {activeMonth && <p className="mt-1 text-xs text-ink-faint">Período: {activeMonth.period}</p>}
          <div className="mt-4 flex items-end gap-2">
            {monthly.map((m) => {
              const active = activeMonth?.month === m.month;
              return (
                <button
                  key={m.month}
                  onClick={() => setSelectedMonth(m.month)}
                  className="flex flex-1 flex-col items-center gap-1.5"
                  title={`${m.month}: ${m.pages.toLocaleString("pt-BR")} páginas`}
                >
                  <span className={`text-[11px] font-semibold ${active ? "text-brand-700" : "text-ink-faint"}`}>
                    {m.pages > 999 ? `${Math.round(m.pages / 1000)}k` : m.pages}
                  </span>
                  <div
                    className={`w-full rounded-t-md transition-colors ${active ? "bg-brand" : "bg-surface-sunken hover:bg-border-strong"}`}
                    style={{ height: `${8 + (m.pages / maxMonthPages) * 64}px` }}
                  />
                  <span className={`text-[11px] font-medium ${active ? "text-ink" : "text-ink-faint"}`}>{m.month}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {printer.toner && printer.toner.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Níveis de suprimento</p>
          <div className="mt-3 flex flex-col gap-3">
            {printer.toner.map((t) => (
              <div key={t.color}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-ink-soft">{t.label}</span>
                  <span className="font-semibold" style={{ color: tonerLevelColor(t.percent) }}>
                    {t.percent}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {needsAttention && lowest && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-tint p-4">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-ink">Recomendação</p>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-soft">
              O nível de {lowest.label.toLowerCase()} está em {lowest.percent}%. Programe a troca do cartucho
              nos próximos dias para evitar interrupção no departamento {printer.department}.
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
