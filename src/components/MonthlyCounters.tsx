"use client";

/**
 * Sem libs externas. Um card por mês (Jan..Jun hoje) com o total de páginas
 * daquele ciclo — a mesma soma que já alimenta o gráfico "Consumo de
 * páginas", só que aqui cada mês vira um indicador próprio, fácil de ler
 * e comparar de relance (pedido explícito: "total de contadores de
 * janeiro", "de fevereiro" etc., um a um).
 */
import { TrendingUp, TrendingDown, Minus, CalendarRange } from "lucide-react";
import type { MonthlyUsageEntry } from "../types";
import { cn } from "../lib/cn";
import styles from "./MonthlyCounters.module.css";

interface MonthlyCountersProps {
  data: MonthlyUsageEntry[];
}

export default function MonthlyCounters({ data }: MonthlyCountersProps) {
  if (data.length === 0) return null;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerIconWrap}>
          <CalendarRange size={17} />
        </div>
        <div>
          <h2 className={styles.title}>Contadores Mensais</h2>
          <p className={styles.subtitle}>Total de páginas impressas em cada ciclo de leitura.</p>
        </div>
      </div>
      <div className={styles.grid}>
        {data.map((m, i) => {
          const prev = data[i - 1];
          const delta = prev && prev.pages > 0 ? ((m.pages - prev.pages) / prev.pages) * 100 : null;
          const Icon = delta === null ? Minus : delta >= 0 ? TrendingUp : TrendingDown;
          const deltaColor = delta === null ? styles.deltaFaint : delta >= 0 ? styles.deltaSuccess : styles.deltaCritical;
          return (
            <div key={m.month} className={styles.monthCard}>
              <p className={styles.monthLabel}>{m.month}</p>
              <p className={styles.monthValue}>{m.pages.toLocaleString("pt-BR")}</p>
              <div className={cn(styles.delta, deltaColor)}>
                <Icon size={12} />
                {delta === null ? "referência" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
              </div>
              <p className={styles.monthPeriod} title={m.period}>
                {m.period}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
