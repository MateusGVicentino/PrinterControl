"use client";

import PrinterTable from "../../components/PrinterTable";
import { useAppData } from "../../lib/app-data";

export default function PrintersPage() {
  const { filteredPrinters, printers, filters, updateFilter, setSelectedPrinter } = useAppData();

  return (
    <PrinterTable
      printers={filteredPrinters}
      totalCount={printers.length}
      filters={filters}
      onFilterChange={updateFilter}
      onOpenDetails={setSelectedPrinter}
    />
  );
}
