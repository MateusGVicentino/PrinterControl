"use client";

import TonerMonitoring from "../../components/TonerMonitoring";
import { useAppData } from "../../lib/app-data";

export default function TonerPage() {
  const { filteredPrinters, setSelectedPrinter, lastChecked, handleScan, scanning } = useAppData();

  return (
    <TonerMonitoring
      printers={filteredPrinters}
      onOpenDetails={setSelectedPrinter}
      lastChecked={lastChecked}
      onRefresh={handleScan}
      refreshing={scanning}
    />
  );
}
