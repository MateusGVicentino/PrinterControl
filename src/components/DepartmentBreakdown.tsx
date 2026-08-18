/**
 * Sem libs externas — barras horizontais em CSS puro (sem recharts aqui,
 * dataset pequeno e fixo). Dados vêm de data/printers.ts → departmentUsage,
 * extraído da aba "Área gráficos" da planilha (consumo agregado por
 * departamento, todas as unidades juntas, Jan–Jun).
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, Building2 } from "lucide-react";
import type { DepartmentUsage } from "../data/printers";
import styles from "./DepartmentBreakdown.module.css";

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
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <Building2 size={17} />
        </div>
        <div>
          <h2 className={styles.title}>Consumo por Departamento</h2>
          <p className={styles.subtitle}>Total de páginas por área, Janeiro a Junho — todas as unidades.</p>
        </div>
      </div>

      <div className={styles.list}>
        {sorted.map((d) => {
          const pct = grandTotal > 0 ? Math.round((d.total / grandTotal) * 100) : 0;
          const isOpen = expanded === d.department;
          const maxMonth = Math.max(...d.monthly);
          return (
            <div key={d.department} className={styles.row}>
              <button
                onClick={() => setExpanded(isOpen ? null : d.department)}
                className={styles.rowButton}
              >
                <div className={styles.deptName} title={d.department}>
                  {d.department}
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${(d.total / maxTotal) * 100}%` }}
                  />
                </div>
                <div className={styles.total}>
                  {d.total.toLocaleString("pt-BR")}
                </div>
                <div className={styles.pct}>{pct}%</div>
                {isOpen ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
              </button>

              {isOpen && (
                <div className={styles.monthly}>
                  {d.monthly.map((pages, i) => (
                    <div key={MONTHS[i]} className={styles.monthCol}>
                      <span className={styles.monthValue}>{pages.toLocaleString("pt-BR")}</span>
                      <div
                        className={styles.monthBar}
                        style={{ height: `${8 + (pages / maxMonth) * 56}px` }}
                      />
                      <span className={styles.monthLabel}>{MONTHS[i]}</span>
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
