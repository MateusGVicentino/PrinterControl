/**
 * Sem libs externas além de lucide-react (ícones). Ordena as impressoras que
 * têm histórico mensal (printer.monthlyPages, ver lib/fetchMonthlyReport.ts)
 * pelo total de páginas no período e mostra as 5 que mais e as 5 que menos
 * imprimem — pensado pra achar rápido quem precisa de upgrade de capacidade
 * ou quem talvez nem devesse estar mais em operação.
 */
import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";
import type { Printer } from "../types";

interface RankedPrinter {
  printer: Printer;
  total: number;
}

function rankPrinters(printers: Printer[]): RankedPrinter[] {
  return printers
    .filter((p) => p.monthlyPages && p.monthlyPages.length > 0)
    .map((p) => ({ printer: p, total: p.monthlyPages!.reduce((sum, m) => sum + m.pages, 0) }))
    .sort((a, b) => b.total - a.total);
}

function RankList({ title, icon, items, tone, onOpenDetails }: {
  title: string;
  icon: React.ReactNode;
  items: RankedPrinter[];
  tone: "brand" | "faint";
  onOpenDetails: (p: Printer) => void;
}) {
  const max = Math.max(1, ...items.map((i) => i.total));
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone === "brand" ? "bg-brand-tint text-brand-700" : "bg-surface-2 text-ink-faint"}`}>
          {icon}
        </div>
        <h3 className="text-[15px] font-bold text-ink">{title}</h3>
      </div>
      <div className="mt-4 flex flex-col gap-3">
        {items.map(({ printer, total }, i) => (
          <button
            key={printer.id}
            onClick={() => onOpenDetails(printer)}
            className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
          >
            <span className="w-4 shrink-0 text-[12px] font-bold text-ink-faint">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[13.5px] font-semibold text-ink">{printer.name}</p>
                <span className="shrink-0 text-[13px] font-bold text-ink">{total.toLocaleString("pt-BR")}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className={`h-full rounded-full ${tone === "brand" ? "bg-brand" : "bg-ink-faint"}`}
                  style={{ width: `${(total / max) * 100}%` }}
                />
              </div>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="py-4 text-center text-sm text-ink-faint">Sem dados suficientes.</p>}
      </div>
    </div>
  );
}

interface PrinterRankingProps {
  printers: Printer[];
  onOpenDetails: (printer: Printer) => void;
}

export default function PrinterRanking({ printers, onOpenDetails }: PrinterRankingProps) {
  const ranked = rankPrinters(printers);
  const top = ranked.slice(0, 5);
  const bottom = ranked.slice(-5).reverse();

  if (ranked.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <RankList
        title="Impressoras que mais imprimem"
        icon={<ArrowUpWideNarrow size={17} />}
        items={top}
        tone="brand"
        onOpenDetails={onOpenDetails}
      />
      <RankList
        title="Impressoras que menos imprimem"
        icon={<ArrowDownWideNarrow size={17} />}
        items={bottom}
        tone="faint"
        onOpenDetails={onOpenDetails}
      />
    </div>
  );
}
