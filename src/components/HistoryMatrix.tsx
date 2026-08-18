"use client";

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
import styles from "./HistoryMatrix.module.css";

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
      <div className={styles.emptyCard}>
        <h2 className={styles.emptyTitle}>Histórico</h2>
        <p className={styles.emptyText}>Ainda sem contadores mensais para exibir.</p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryLeft}>
            <div className={styles.iconBox}>
              <HistoryIcon size={17} />
            </div>
            <div>
              <h2 className={styles.summaryTitle}>Histórico de Impressões</h2>
              <p className={styles.summarySubtitle}>
                {withHistory.length} impressoras · {sites.length} unidades · {months[0]}–{months[months.length - 1]}
              </p>
            </div>
          </div>
          <div className={styles.actionsRow}>
            <button onClick={expandAll} className={styles.actionButton}>
              <Maximize2 size={13} />
              Expandir tudo
            </button>
            <button onClick={collapseAll} className={styles.actionButton}>
              <Minimize2 size={13} />
              Recolher tudo
            </button>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.summaryTable}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.th}>Total geral</th>
                {months.map((m) => (
                  <th key={m} className={styles.thRight}>{m}</th>
                ))}
                <th className={styles.thTotal}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className={styles.summaryBodyRow}>
                <td className={styles.td}>Todas as unidades</td>
                {grandTotals.map((t, i) => (
                  <td key={i} className={styles.tdRightMono}>{t.toLocaleString("pt-BR")}</td>
                ))}
                <td className={styles.tdTotalMono}>
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
          <div key={site} className={styles.siteCard}>
            <button onClick={() => toggleSite(site)} className={styles.siteToggle}>
              <div className={styles.siteToggleLeft}>
                {isOpen ? <ChevronDown size={16} className={styles.chevronIcon} /> : <ChevronRight size={16} className={styles.chevronIcon} />}
                <h3 className={styles.siteTitle}>{site}</h3>
                <span className={styles.countBadge}>
                  {sitePrinters.length} impressora{sitePrinters.length !== 1 ? "s" : ""}
                </span>
              </div>
              <span className={styles.siteTotalLabel}>{siteTotal.toLocaleString("pt-BR")} páginas</span>
            </button>

            {isOpen && (
              <div className={styles.siteTableWrap}>
                <table className={styles.siteTable}>
                  <thead>
                    <tr className={styles.theadRow}>
                      <th className={styles.th}>Nome</th>
                      <th className={styles.th}>IP</th>
                      <th className={styles.th}>Departamento</th>
                      {months.map((m) => (
                        <th key={m} className={styles.thSiteMonth}>{m}</th>
                      ))}
                      <th className={styles.thSiteTotal}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sitePrinters.map((p) => {
                      const total = p.monthlyPages!.reduce((sum, m) => sum + m.pages, 0);
                      return (
                        <tr key={p.id} className={styles.bodyRow}>
                          <td className={styles.nameCell}>{p.name}</td>
                          <td className={styles.ipCell}>{p.ip}</td>
                          <td className={styles.deptCell} title={getDepartmentLabel(p)}>
                            {getDepartmentLabel(p)}
                          </td>
                          {p.monthlyPages!.map((m) => (
                            <td key={m.month} className={styles.monthCell}>
                              {m.pages.toLocaleString("pt-BR")}
                            </td>
                          ))}
                          <td className={styles.totalCell}>
                            {total.toLocaleString("pt-BR")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className={styles.subtotalRow}>
                      <td className={styles.subtotalLabelCell} colSpan={3}>Subtotal — {site}</td>
                      {siteMonthTotals.map((t, i) => (
                        <td key={i} className={styles.subtotalMonthCell}>{t.toLocaleString("pt-BR")}</td>
                      ))}
                      <td className={styles.subtotalTotalCell}>{siteTotal.toLocaleString("pt-BR")}</td>
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
