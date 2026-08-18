"use client";

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
import { cn } from "../lib/cn";
import styles from "./BottomCharts.module.css";

function PagesConsumedCard({ monthlyUsage }: { monthlyUsage: MonthlyUsageEntry[] }) {
  const { theme } = useTheme();
  const c = getChartColors(theme);
  const last = monthlyUsage[monthlyUsage.length - 1];
  if (!last) {
    return (
      <div className={styles.card}>
        <h3 className={styles.title}>Consumo de páginas (mês)</h3>
        <p className={styles.emptyText}>
          Ainda sem histórico mensal. Rode scripts/Relatorio-Mensal.ps1 por dois meses seguidos para o primeiro ponto aparecer aqui.
        </p>
      </div>
    );
  }
  return (
    <div className={styles.card}>
      <div className={styles.headerRow}>
        <h3 className={styles.title}>Consumo de páginas (mês)</h3>
        <span className={styles.periodBadge}>
          {last.month}: {last.pages.toLocaleString("pt-BR")}
        </span>
      </div>
      <p className={styles.periodText}>Período: {last.period}</p>
      <div className={styles.chartWrap}>
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
    <div className={cn(styles.card, styles.cardFlexCol)}>
      <h3 className={styles.title}>Impressões totais</h3>
      <p className={styles.totalValue}>{total.toLocaleString("pt-BR")}</p>
      <div className={cn(styles.growthRow, isUp ? styles.growthUp : styles.growthDown)}>
        {isUp ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
        {isUp ? "+" : ""}
        {growth.toFixed(1)}%
        <span className={styles.growthLabel}>vs mês anterior</span>
      </div>
      <div className={styles.barsRow} title="Páginas por mês (Jan–Jun)">
        {monthlyUsage.map((m) => (
          <div
            key={m.month}
            className={styles.bar}
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
    <div className={styles.card}>
      <h3 className={styles.title}>Dispositivos com alerta</h3>
      <div className={styles.donutRow}>
        <div className={styles.donutWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={38} outerRadius={56} startAngle={90} endAngle={450} stroke="none">
                {donutData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className={styles.donutCenter}>
            <span className={styles.attentionValue}>{attention}</span>
          </div>
        </div>
        <div>
          <p className={styles.attentionValue}>{attention} Atenção</p>
          <p className={styles.attentionPct}>{pct}% do total</p>
          <button onClick={onViewAll} className={styles.viewAllButton}>
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
    <div className={styles.grid}>
      <PagesConsumedCard monthlyUsage={monthlyUsage} />
      <TotalPrintsCard monthlyUsage={monthlyUsage} />
      <AlertsDonutCard attention={attention} total={total} onViewAll={onViewAlerts} />
    </div>
  );
}
