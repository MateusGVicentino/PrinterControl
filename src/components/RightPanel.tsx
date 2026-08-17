/**
 * Dependência externa: lucide-react (ícones). `globalToner` (import de
 * data/printers.ts) é só o fallback default do prop — na prática App.tsx
 * sempre passa o valor calculado por lib/deriveFromPrinters.ts, então esse
 * import raramente é o que renderiza de fato.
 */
import { ChevronRight, TriangleAlert, FileBarChart2, History, PlusCircle, Settings, Bell } from "lucide-react";
import { globalToner as mockGlobalToner } from "../data/printers";
import { tonerChannelColor } from "../lib/tonerColor";
import { useToast } from "../lib/toast";
import { useTheme } from "../lib/theme";
import type { Printer, TonerLevel } from "../types";

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
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2"
    >
      <span className="text-ink-faint">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-critical px-1 text-[11px] font-bold text-white">
          {badge}
        </span>
      ) : (
        <ChevronRight size={15} className="text-ink-faint" />
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
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-ink">Níveis de toner</h3>
        <div className="mt-4 flex flex-col gap-4">
          {globalToner.map((t) => (
            <div key={t.color}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-soft">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: tonerChannelColor(t.color, theme) }}
                  />
                  {t.label}
                </span>
                <span className="font-semibold text-ink">{t.percent}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div className="h-full rounded-full" style={{ width: `${t.percent}%`, backgroundColor: tonerChannelColor(t.color, theme) }} />
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={() => onNavigate("printers")}
          className="mt-4 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600"
        >
          Ver detalhes
          <ChevronRight size={15} />
        </button>
      </div>

      {critical && (
        <div className="rounded-2xl border border-critical/25 bg-surface p-5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-critical-tint text-critical">
              <TriangleAlert size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wide text-critical">Toner baixo</p>
              <p className="text-xl font-extrabold text-ink">{critical.percent}% restante</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-soft">Considere substituir em breve.</p>
          <button
            onClick={() => {
              if (worstPrinter) onOpenDetails(worstPrinter);
              else push({ variant: "info", title: "Sem impressora associada a este alerta ainda." });
            }}
            className="mt-4 w-full rounded-xl bg-critical py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-critical/90"
          >
            Ver Recomendações
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="mb-2 text-[15px] font-bold text-ink">Ações rápidas</h3>
        <div className="flex flex-col gap-1">
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
