"use client";

import HistoryMatrix from "../../components/HistoryMatrix";
import { useAppData } from "../../lib/app-data";

export default function HistoryPage() {
  const { printers } = useAppData();

  return <HistoryMatrix printers={printers} />;
}
