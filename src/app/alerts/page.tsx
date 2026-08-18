"use client";

import AlertsView from "../../components/AlertsView";
import { useAppData } from "../../lib/app-data";

export default function AlertsPage() {
  const { alerts, printers, setSelectedPrinter } = useAppData();

  return <AlertsView alerts={alerts} printers={printers} onSelectPrinter={setSelectedPrinter} />;
}
