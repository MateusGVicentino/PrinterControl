"use client";

// Dependência externa: só lucide-react (ícones). Cards clicáveis — clicar
// aplica o filtro de status correspondente (mesmo estado do Sidebar).
import { Printer, Wifi, WifiOff, TriangleAlert } from "lucide-react";
import { cn } from "../lib/cn";
import styles from "./StatCards.module.css";

interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "critical" | "warning";
  active?: boolean;
  onClick?: () => void;
}

const TONE: Record<StatCardProps["tone"], { icon: string; active: string }> = {
  brand: { icon: styles.iconBrand, active: styles.activeBrand },
  success: { icon: styles.iconSuccess, active: styles.activeSuccess },
  critical: { icon: styles.iconCritical, active: styles.activeCritical },
  warning: { icon: styles.iconWarning, active: styles.activeWarning },
};

function StatCard({ label, value, sublabel, icon, tone, active, onClick }: StatCardProps) {
  const t = TONE[tone];
  return (
    <button onClick={onClick} className={cn(styles.card, active ? t.active : styles.cardInactive)}>
      <div className={styles.cardHeader}>
        <p className={styles.label}>{label}</p>
        <div className={cn(styles.iconWrap, t.icon)}>{icon}</div>
      </div>
      <p className={styles.value}>{value}</p>
      <p className={styles.sublabel}>{sublabel}</p>
    </button>
  );
}

interface StatCardsProps {
  total: number;
  online: number;
  offline: number;
  attention: number;
  activeStatus: "Todos" | "online" | "offline" | "atencao";
  onSelectStatus: (status: "Todos" | "online" | "offline" | "atencao") => void;
}

export default function StatCards({ total, online, offline, attention, activeStatus, onSelectStatus }: StatCardsProps) {
  return (
    <div className={styles.grid}>
      <StatCard
        label="Total"
        value={total}
        sublabel="Impressoras detectadas"
        icon={<Printer size={19} />}
        tone="brand"
        active={activeStatus === "Todos"}
        onClick={() => onSelectStatus("Todos")}
      />
      <StatCard
        label="Online"
        value={online}
        sublabel="Impressoras online"
        icon={<Wifi size={19} />}
        tone="success"
        active={activeStatus === "online"}
        onClick={() => onSelectStatus("online")}
      />
      <StatCard
        label="Offline"
        value={offline}
        sublabel="Impressoras offline"
        icon={<WifiOff size={19} />}
        tone="critical"
        active={activeStatus === "offline"}
        onClick={() => onSelectStatus("offline")}
      />
      <StatCard
        label="Atenção"
        value={attention}
        sublabel="Precisam de atenção"
        icon={<TriangleAlert size={19} />}
        tone="warning"
        active={activeStatus === "atencao"}
        onClick={() => onSelectStatus("atencao")}
      />
    </div>
  );
}
