"use client";

import { Download } from "lucide-react";
import MonthlyCounters from "../../components/MonthlyCounters";
import PrinterRanking from "../../components/PrinterRanking";
import DepartmentBreakdown from "../../components/DepartmentBreakdown";
import DecommissionedList from "../../components/DecommissionedList";
import { useAppData } from "../../lib/app-data";
import { useToast } from "../../lib/toast";
import { exportPrintersCsv } from "../../lib/exportCsv";
import styles from "./page.module.css";

export default function ReportsPage() {
  const { printers, stats, monthlyUsage, departmentUsage, decommissionedPrinters, setSelectedPrinter } = useAppData();
  const { push } = useToast();

  return (
    <>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div>
            <h2 className={styles.summaryTitle}>Relatório de Impressoras</h2>
            <p className={styles.summarySubtitle}>Resumo da frota — {printers.length} equipamentos monitorados.</p>
          </div>
          <button
            onClick={() => {
              exportPrintersCsv(printers);
              push({ variant: "success", title: "CSV exportado", description: `${printers.length} impressora(s) incluída(s) no arquivo.` });
            }}
            className={styles.exportButton}
          >
            <Download size={16} />
            Exportar relatório (CSV)
          </button>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryStat}>
            <p className={styles.summaryStatLabel}>TOTAL</p>
            <p className={styles.summaryStatValue}>{stats.total}</p>
          </div>
          <div className={`${styles.summaryStat} ${styles.summaryStatSuccess}`}>
            <p className={styles.summaryStatLabelSuccess}>ONLINE</p>
            <p className={styles.summaryStatValue}>{stats.online}</p>
          </div>
          <div className={styles.summaryStat}>
            <p className={styles.summaryStatLabel}>OFFLINE</p>
            <p className={styles.summaryStatValue}>{stats.offline}</p>
          </div>
          <div className={`${styles.summaryStat} ${styles.summaryStatWarning}`}>
            <p className={styles.summaryStatLabelWarning}>ATENÇÃO</p>
            <p className={styles.summaryStatValue}>{stats.attention}</p>
          </div>
        </div>
      </div>

      <MonthlyCounters data={monthlyUsage} />
      <PrinterRanking printers={printers} onOpenDetails={setSelectedPrinter} />
      <DepartmentBreakdown data={departmentUsage} />
      <DecommissionedList data={decommissionedPrinters} />
    </>
  );
}
