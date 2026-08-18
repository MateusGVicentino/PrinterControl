"use client";

// Dependência externa: só lucide-react (ícones). `alerts` vem pronto de
// lib/deriveFromPrinters.ts — este componente só exibe, não calcula nada.
import { TriangleAlert, ChevronRight } from "lucide-react";
import type { Alert } from "../types";
import styles from "./AlertBanner.module.css";

interface AlertBannerProps {
  alerts: Alert[];
  onViewAll: () => void;
  onSelectAlert?: (alert: Alert) => void;
}

export default function AlertBanner({ alerts, onViewAll, onSelectAlert }: AlertBannerProps) {
  if (alerts.length === 0) return null;
  const top = alerts[0];

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <TriangleAlert size={16} className={styles.headerIcon} />
          <h3 className={styles.headerTitle}>Alertas importantes</h3>
          <span className={styles.count}>{alerts.length}</span>
        </div>
        <button onClick={onViewAll} className={styles.viewAll}>
          Ver todos
          <ChevronRight size={15} />
        </button>
      </div>
      <button onClick={() => onSelectAlert?.(top)} className={styles.topAlert}>
        <TriangleAlert size={16} className={styles.topAlertIcon} />
        <p className={styles.topAlertMessage}>{top.message}</p>
      </button>
    </div>
  );
}
