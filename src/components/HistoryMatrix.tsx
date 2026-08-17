/**
 * Sem libs externas. Recria a estrutura original da planilha (uma tabela
 * IP/Modelo/Departamento + coluna por mês, agrupada por unidade) dentro do
 * painel — é a visão "Histórico" completa, impressora a impressora, mês a
 * mês. Dependência local: lib/site.ts (separa "Depto — Unidade").
 */
import { useState } from "react";
import { ChevronDown, ChevronRight, Maximize2, Minimize2, History as HistoryIcon } from "lucide-react";
import type { Printer } from "../types";
import { getPrinterSite, getDepartmentLabel } from "../lib/site";

interface HistoryMatrixProps {
  printers: Printer[];
}

export default function HistoryMatrix({ printers }: HistoryMatrixProps) {
  const withHistory = printers.filter((p) => p.monthlyPages && p.monthlyPages.length > 0);
  const months = withHistory[0]?.monthlyPages?.map((m) => m.month) ?? [];

  const bySite = new Map<string, Printer[]>();
  for (const p of withHistory) {
    const site = getPrinterSite(p);
    if (!bySite.has(site)) bySite.set(site, []);
    bySite.get(site)!.push(p);
  }
  const sites = Array.from(bySite.keys()).sort();

  const [openSites, setOpenSites] = useState<Set<string>>(new Set(sites.slice(0, 1)));

  function toggleSite(site: string) {
    setOpenSites((prev) => {
      const next = new Set(prev);
      if (next.has(site)) next.delete(site);
      else next.add(site);
      return next;
    });
  }

  function expandAll() {
    setOpenSites(new Set(sites));
  }
  function collapseAll() {
    setOpenSites(new Set());
  }

  const grandTotals = months.map((_, i) => withHistory.reduce((sum, p) => sum + (p.monthlyPages?.[i]?.pages ?? 0), 0));
  const grandTotal = grandTotals.reduce((a, b) => a + b, 0);

  if (months.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Histórico</h2>
        <p className="mt-2 text-sm text-ink-faint">Ainda sem contadores mensais para exibir.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
              <HistoryIcon size={17} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-ink">Histórico de Impressões</h2>
              <p className="text-sm text-ink-faint">
                {withHistory.length} impressoras · {sites.length} unidades · {months[0]}–{months[months.length - 1]}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-sunken"
            >
              <Maximize2 size={13} />
              Expandir tudo
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-sunken"
            >
              <Minimize2 size={13} />
              Recolher tudo
            </button>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                <th className="bg-surface-2 px-4 py-2.5">Total geral</th>
                {months.map((m) => (
                  <th key={m} className="bg-surface-2 px-4 py-2.5 text-right">{m}</th>
                ))}
                <th className="bg-brand-tint px-4 py-2.5 text-right text-brand-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border font-bold text-ink">
                <td className="px-4 py-2.5">Todas as unidades</td>
                {grandTotals.map((t, i) => (
                  <td key={i} className="px-4 py-2.5 text-right font-mono tabular-nums">{t.toLocaleString("pt-BR")}</td>
                ))}
                <td className="bg-brand-tint px-4 py-2.5 text-right font-mono tabular-nums text-brand-700">
                  {grandTotal.toLocaleString("pt-BR")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {sites.map((site) => {
        const sitePrinters = bySite.get(site)!;
        const isOpen = openSites.has(site);
        const siteMonthTotals = months.map((_, i) => sitePrinters.reduce((sum, p) => sum + (p.monthlyPages?.[i]?.pages ?? 0), 0));
        const siteTotal = siteMonthTotals.reduce((a, b) => a + b, 0);

        return (
          <div key={site} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <button
              onClick={() => toggleSite(site)}
              className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-surface-2"
            >
              <div className="flex items-center gap-2.5">
                {isOpen ? <ChevronDown size={16} className="text-ink-faint" /> : <ChevronRight size={16} className="text-ink-faint" />}
                <h3 className="text-[15px] font-bold text-ink">{site}</h3>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-faint">
                  {sitePrinters.length} impressora{sitePrinters.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-sm font-bold text-ink">{siteTotal.toLocaleString("pt-BR")} páginas</span>
            </button>

            {isOpen && (
              <div className="overflow-x-auto border-t border-border">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      <th className="bg-surface-2 px-4 py-2.5">Nome</th>
                      <th className="bg-surface-2 px-4 py-2.5">IP</th>
                      <th className="bg-surface-2 px-4 py-2.5">Departamento</th>
                      {months.map((m) => (
                        <th key={m} className="bg-surface-2 px-3 py-2.5 text-right">{m}</th>
                      ))}
                      <th className="bg-surface-2 px-4 py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sitePrinters.map((p) => {
                      const total = p.monthlyPages!.reduce((sum, m) => sum + m.pages, 0);
                      return (
                        <tr key={p.id} className="border-t border-border hover:bg-surface-2">
                          <td className="px-4 py-2.5 font-semibold text-ink">{p.name}</td>
                          <td className="px-4 py-2.5 text-ink-faint">{p.ip}</td>
                          <td className="max-w-[160px] truncate px-4 py-2.5 text-ink-soft" title={getDepartmentLabel(p)}>
                            {getDepartmentLabel(p)}
                          </td>
                          {p.monthlyPages!.map((m) => (
                            <td key={m.month} className="px-3 py-2.5 text-right font-mono tabular-nums text-ink-soft">
                              {m.pages.toLocaleString("pt-BR")}
                            </td>
                          ))}
                          <td className="px-4 py-2.5 text-right font-mono font-bold tabular-nums text-ink">
                            {total.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-border-strong bg-surface-2 font-bold text-ink">
                      <td className="px-4 py-2.5" colSpan={3}>Subtotal — {site}</td>
                      {siteMonthTotals.map((t, i) => (
                        <td key={i} className="px-3 py-2.5 text-right font-mono tabular-nums">{t.toLocaleString("pt-BR")}</td>
                      ))}
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{siteTotal.toLocaleString("pt-BR")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
