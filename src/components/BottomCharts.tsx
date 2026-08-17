/**
 * Dependências externas: recharts (AreaChart/PieChart — os dois gráficos
 * deste arquivo) e lucide-react (ícones de tendência/seta). `monthlyUsage`
 * chega via prop agora (antes vinha fixo de src/data/printers.ts) para que
 * App.tsx possa injetar o relatório mensal REAL (scripts/Relatorio-Mensal.ps1
 * → /data/monthly-report.json) quando ele existir, sem precisar tocar aqui.
 * Cores dos gráficos vêm de lib/chartColors.ts (útil porque recharts recebe
 * cor como string literal, não enxerga os tokens CSS do tema escuro/claro).
 */
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import type { MonthlyUsageEntry } from "../types";
import { useTheme } from "../lib/theme";
import { getChartColors } from "../lib/chartColors";

function PagesConsumedCard({ monthlyUsage }: { monthlyUsage: MonthlyUsageEntry[] }) {
  const { theme } = useTheme();
  const c = getChartColors(theme);
  const last = monthlyUsage[monthlyUsage.length - 1];
  if (!last) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-ink">Consumo de páginas (mês)</h3>
        <p className="mt-4 text-sm text-ink-faint">
          Ainda sem histórico mensal. Rode scripts/Relatorio-Mensal.ps1 por dois meses seguidos para o primeiro ponto aparecer aqui.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[15px] font-bold text-ink">Consumo de páginas (mês)</h3>
        <span className="rounded-full bg-brand-tint px-2.5 py-1 text-xs font-semibold text-brand-700">
          {last.month}: {last.pages.toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-ink-faint">Período: {last.period}</p>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyUsage} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="pagesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.brand} stopOpacity={0.35} />
                <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={c.grid} vertical={false} />
            <XAxis dataKey="month" stroke={c.axis} tick={{ fill: c.tickText, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              stroke={c.axis}
              tick={{ fill: c.tickText, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{ background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, fontSize: 13 }}
              labelStyle={{ color: c.tooltipLabel }}
              itemStyle={{ color: c.brand }}
              formatter={(value) => [Number(value).toLocaleString("pt-BR"), "Páginas"]}
              labelFormatter={(label) => {
                const entry = monthlyUsage.find((m) => m.month === label);
                return entry ? `${label} · ${entry.period}` : String(label ?? "");
              }}
            />
            <Area
              type="monotone"
              dataKey="pages"
              stroke={c.brand}
              strokeWidth={2.5}
              fill="url(#pagesFill)"
              dot={{ r: 4, fill: c.brand, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TotalPrintsCard({ monthlyUsage }: { monthlyUsage: MonthlyUsageEntry[] }) {
  const total = monthlyUsage.reduce((sum, m) => sum + m.pages, 0);
  const last = monthlyUsage[monthlyUsage.length - 1];
  const prev = monthlyUsage[monthlyUsage.length - 2];
  const growth = last && prev && prev.pages > 0 ? ((last.pages - prev.pages) / prev.pages) * 100 : 0;
  const isUp = growth >= 0;
  const maxPages = Math.max(1, ...monthlyUsage.map((m) => m.pages));

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-ink">Impressões totais</h3>
      <p className="mt-3 text-[2.25rem] font-extrabold leading-none tracking-tight text-ink">
        {total.toLocaleString("pt-BR")}
      </p>
      <div className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${isUp ? "text-success" : "text-critical"}`}>
        {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        {isUp ? "+" : ""}
        {growth.toFixed(1)}%
        <span className="font-normal text-ink-faint">vs mês anterior</span>
      </div>
      <div className="mt-auto flex items-end gap-2 pt-6" title="Páginas por mês (Jan–Jun)">
        {monthlyUsage.map((m) => (
          <div
            key={m.month}
            className="flex-1 rounded-t-lg bg-brand/80"
            style={{ height: `${8 + (m.pages / maxPages) * 82}px` }}
            title={`${m.month}: ${m.pages.toLocaleString("pt-BR")}`}
          />
        ))}
      </div>
    </div>
  );
}

interface AlertsDonutCardProps {
  attention: number;
  total: number;
  onViewAll: () => void;
}

function AlertsDonutCard({ attention, total, onViewAll }: AlertsDonutCardProps) {
  const { theme } = useTheme();
  const c = getChartColors(theme);
  const ok = Math.max(total - attention, 0);
  const pct = total > 0 ? Math.round((attention / total) * 100) : 0;
  const donutData = [
    { name: "Atenção", value: attention || 0.0001, color: c.warning },
    { name: "OK", value: ok, color: c.surfaceSunken },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h3 className="text-[15px] font-bold text-ink">Dispositivos com alerta</h3>
      <div className="mt-2 flex items-center gap-4">
        <div className="relative h-32 w-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={38} outerRadius={56} startAngle={90} endAngle={450} stroke="none">
                {donutData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-extrabold text-warning">{attention}</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-extrabold text-warning">{attention} Atenção</p>
          <p className="text-sm text-ink-faint">{pct}% do total</p>
          <button onClick={onViewAll} className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-600">
            Ver todos
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface BottomChartsProps {
  attention: number;
  total: number;
  monthlyUsage: MonthlyUsageEntry[];
  onViewAlerts: () => void;
}

export default function BottomCharts({ attention, total, monthlyUsage, onViewAlerts }: BottomChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <PagesConsumedCard monthlyUsage={monthlyUsage} />
      <TotalPrintsCard monthlyUsage={monthlyUsage} />
      <AlertsDonutCard attention={attention} total={total} onViewAll={onViewAlerts} />
    </div>
  );
}
