/**
 * Rota "/" — Dashboard. Equivalente ao bloco `activeNav === "dashboard"` que
 * antes vivia em App.tsx; os dados vêm do AppDataProvider (lib/app-data.tsx).
 */
"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import StatCards from "../components/StatCards";
import AlertBanner from "../components/AlertBanner";
import PrinterTable from "../components/PrinterTable";
import RightPanel from "../components/RightPanel";
import BottomCharts from "../components/BottomCharts";
import { useAppData } from "../lib/app-data";
import { NAV_ROUTES } from "../lib/routes";
import { cn } from "../lib/cn";
import styles from "./page.module.css";

export default function DashboardPage() {
  const router = useRouter();
  const {
    lastChecked,
    scanning,
    handleScan,
    initialLoading,
    stats,
    filters,
    updateFilter,
    alerts,
    handleAlertSelect,
    filteredPrinters,
    printers,
    setSelectedPrinter,
    globalToner,
    worstPrinter,
    monthlyUsage,
  } = useAppData();

  return (
    <>
      <div className={styles.scanBar}>
        <p>
          Última verificação: <span className={styles.scanBarStrong}>{lastChecked.toLocaleTimeString("pt-BR")}</span>
        </p>
        <button onClick={handleScan} disabled={scanning} className={styles.scanButton}>
          <RefreshCw size={13} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Verificando..." : "Verificar agora"}
        </button>
      </div>

      {initialLoading ? (
        <div className={styles.statsSkeletonGrid}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={cn(styles.skeletonCard, styles.skeletonCardStats, "animate-pulse")} />
          ))}
        </div>
      ) : (
        <StatCards
          total={stats.total}
          online={stats.online}
          offline={stats.offline}
          attention={stats.attention}
          activeStatus={filters.status === "Todos" ? "Todos" : filters.status}
          onSelectStatus={(s) => updateFilter("status", s)}
        />
      )}

      {!initialLoading && alerts.length > 0 && (
        <AlertBanner alerts={alerts} onViewAll={() => router.push("/alerts")} onSelectAlert={handleAlertSelect} />
      )}

      <div className={styles.mainGrid}>
        {initialLoading ? (
          <div className={cn(styles.skeletonCard, styles.skeletonCardTable, "animate-pulse")} />
        ) : (
          <PrinterTable
            printers={filteredPrinters}
            totalCount={printers.length}
            filters={filters}
            onFilterChange={updateFilter}
            onOpenDetails={setSelectedPrinter}
            compact
          />
        )}
        <RightPanel
          alertCount={alerts.length}
          globalToner={globalToner}
          worstPrinter={worstPrinter}
          onOpenDetails={setSelectedPrinter}
          onNavigate={(id) => router.push(NAV_ROUTES[id] ?? "/")}
        />
      </div>

      <BottomCharts attention={stats.attention} total={stats.total} monthlyUsage={monthlyUsage} onViewAlerts={() => router.push("/alerts")} />
    </>
  );
}
