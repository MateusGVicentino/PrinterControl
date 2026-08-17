/**
 * Sem libs externas. Um card por mês (Jan..Jun hoje) com o total de páginas
 * daquele ciclo — a mesma soma que já alimenta o gráfico "Consumo de
 * páginas", só que aqui cada mês vira um indicador próprio, fácil de ler
 * e comparar de relance (pedido explícito: "total de contadores de
 * janeiro", "de fevereiro" etc., um a um).
 */
import { TrendingUp, TrendingDown, Minus, CalendarRange } from "lucide-react";
import type { MonthlyUsageEntry } from "../types";

interface MonthlyCountersProps {
  data: MonthlyUsageEntry[];
}

export default function MonthlyCounters({ data }: MonthlyCountersProps) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
          <CalendarRange size={17} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Contadores Mensais</h2>
          <p className="text-sm text-ink-faint">Total de páginas impressas em cada ciclo de leitura.</p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {data.map((m, i) => {
          const prev = data[i - 1];
          const delta = prev && prev.pages > 0 ? ((m.pages - prev.pages) / prev.pages) * 100 : null;
          const Icon = delta === null ? Minus : delta >= 0 ? TrendingUp : TrendingDown;
          const deltaColor = delta === null ? "text-ink-faint" : delta >= 0 ? "text-success" : "text-critical";
          return (
            <div key={m.month} className="rounded-xl border border-border bg-canvas p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{m.month}</p>
              <p className="mt-1.5 text-xl font-extrabold leading-none tracking-tight text-ink">
                {m.pages.toLocaleString("pt-BR")}
              </p>
              <div className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${deltaColor}`}>
                <Icon size={12} />
                {delta === null ? "referência" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
              </div>
              <p className="mt-1 truncate text-[10.5px] text-ink-faint" title={m.period}>
                {m.period}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
