/**
 * Sem libs externas — barras horizontais em CSS puro (sem recharts aqui,
 * dataset pequeno e fixo). Dados vêm de data/printers.ts → departmentUsage,
 * extraído da aba "Área gráficos" da planilha (consumo agregado por
 * departamento, todas as unidades juntas, Jan–Jun).
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Building2 } from "lucide-react";
import type { DepartmentUsage } from "../data/printers";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

interface DepartmentBreakdownProps {
  data: DepartmentUsage[];
}

export default function DepartmentBreakdown({ data }: DepartmentBreakdownProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const sorted = [...data].sort((a, b) => b.total - a.total);
  const grandTotal = sorted.reduce((sum, d) => sum + d.total, 0);
  const maxTotal = Math.max(...sorted.map((d) => d.total));

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
          <Building2 size={17} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Consumo por Departamento</h2>
          <p className="text-sm text-ink-faint">Total de páginas por área, Janeiro a Junho — todas as unidades.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3">
        {sorted.map((d) => {
          const pct = grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0;
          const isOpen = expanded === d.department;
          const maxMonth = Math.max(...d.monthly);
          return (
            <div key={d.department} className="rounded-xl border border-border bg-canvas p-4">
              <button
                onClick={() => setExpanded(isOpen ? null : d.department)}
                className="flex w-full items-center gap-4 text-left"
              >
                <div className="w-48 shrink-0 truncate text-sm font-semibold text-ink" title={d.department}>
                  {d.department}
                </div>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(d.total / maxTotal) * 100}%` }}
                  />
                </div>
                <div className="w-24 shrink-0 text-right text-sm font-bold text-ink">
                  {d.total.toLocaleString("pt-BR")}
                </div>
                <div className="w-10 shrink-0 text-right text-xs text-ink-faint">{pct}%</div>
                {isOpen ? <ChevronUp size={16} className="shrink-0 text-ink-faint" /> : <ChevronDown size={16} className="shrink-0 text-ink-faint" />}
              </button>

              {isOpen && (
                <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
                  {d.monthly.map((pages, i) => (
                    <div key={MONTHS[i]} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-ink-soft">{pages.toLocaleString("pt-BR")}</span>
                      <div
                        className="w-full rounded-t-md bg-brand/70"
                        style={{ height: `${8 + (pages / maxMonth) * 56}px` }}
                      />
                      <span className="text-[11px] text-ink-faint">{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
