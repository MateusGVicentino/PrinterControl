"use client";

/**
 * Dependências externas: react (paginação/view state) e lucide-react
 * (ícones). Dependências locais: PrinterStatusBadge, lib/tonerColor,
 * lib/filterPrinters (tipo do estado de filtro, controlado pelo pai),
 * lib/printerType (pills "Tipo"). Paginação e visão lista/grade são estado
 * PRÓPRIO deste componente (não sobem para App.tsx) — só os filtros globais
 * (busca/status/tipo/departamento) vêm de fora via props.
 */
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Rows3,
  LayoutGrid,
  FileText,
  Globe,
  Printer as PrinterIcon,
  Settings,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { Printer } from "../types";
import PrinterStatusBadge from "./PrinterStatusBadge";
import { tonerChannelColor, tonerLevelColor } from "../lib/tonerColor";
import type { PrinterFilters } from "../lib/filterPrinters";
import type { PrinterStatus } from "../types";
import type { PrinterType } from "../lib/printerType";
import { useToast } from "../lib/toast";
import { useTheme } from "../lib/theme";
import { cn } from "../lib/cn";
import styles from "./PrinterTable.module.css";

interface PrinterTableProps {
  printers: Printer[];
  totalCount: number;
  filters: PrinterFilters;
  onFilterChange: <K extends keyof PrinterFilters>(key: K, value: PrinterFilters[K]) => void;
  onOpenDetails: (printer: Printer) => void;
  /** Esconde as colunas Modelo/Ações — usado no card embutido do Dashboard,
   * onde a tabela divide espaço com o painel lateral e não cabem todas as
   * colunas sem rolagem horizontal. A página "Impressoras" continua completa. */
  compact?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function PrinterTable({ printers, totalCount, filters, onFilterChange, onOpenDetails, compact = false }: PrinterTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);
  const { push } = useToast();
  const { theme } = useTheme();

  const totalPages = Math.max(1, Math.ceil(printers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => printers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [printers, currentPage, pageSize]
  );

  function handleTestPage(p: Printer, e: React.MouseEvent) {
    e.stopPropagation();
    push({ variant: "success", title: "Página de teste enviada", description: `Job enfileirado para ${p.name}.` });
  }

  function handleWebAccess(p: Printer, e: React.MouseEvent) {
    e.stopPropagation();
    window.open(`http://${p.ip}`, "_blank", "noopener");
  }

  function handleSettings(p: Printer, e: React.MouseEvent) {
    e.stopPropagation();
    push({ variant: "info", title: "Gerenciamento remoto", description: `Configurações avançadas de ${p.name} chegam em breve.` });
  }

  const statusOptions: { label: string; value: "Todos" | PrinterStatus }[] = [
    { label: "Todos", value: "Todos" },
    { label: "Online", value: "online" },
    { label: "Offline", value: "offline" },
    { label: "Atenção", value: "atencao" },
  ];
  const typeOptions: { label: string; value: "Todos" | PrinterType }[] = [
    { label: "Todos", value: "Todos" },
    { label: "A4", value: "A4" },
    { label: "Etiqueta", value: "Etiqueta" },
    { label: "Portátil", value: "Portatil" },
  ];

  return (
    <div className={styles.root}>
      <div className={styles.headerRow}>
        <div>
          <h3 className={styles.title}>Impressoras</h3>
          <p className={styles.subtitle}>
            {printers.length} de {totalCount} resultados
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.searchBox}>
            <Search size={15} />
            <input
              value={filters.query}
              onChange={(e) => {
                onFilterChange("query", e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar..."
              className={styles.searchInput}
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={cn(
              styles.filterButton,
              showFilters || filters.status !== "Todos" || filters.type !== "Todos"
                ? styles.filterButtonActive
                : styles.filterButtonInactive
            )}
          >
            <SlidersHorizontal size={15} />
            Filtros
          </button>
          <div className={styles.viewToggle}>
            <button
              onClick={() => setView("list")}
              className={cn(styles.viewButton, view === "list" ? styles.viewButtonActive : styles.viewButtonInactive)}
            >
              <Rows3 size={16} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={cn(styles.viewButton, view === "grid" ? styles.viewButtonActive : styles.viewButtonInactive)}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Status</span>
            <div className={styles.filterPillRow}>
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange("status", opt.value);
                    setPage(1);
                  }}
                  className={cn(styles.filterPill, filters.status === opt.value ? styles.filterPillActive : styles.filterPillInactive)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tipo</span>
            <div className={styles.filterPillRow}>
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange("type", opt.value);
                    setPage(1);
                  }}
                  className={cn(styles.filterPill, filters.type === opt.value ? styles.filterPillActive : styles.filterPillInactive)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className={styles.tableWrap}>
          <table className={cn(styles.table, compact && styles.tableCompact)}>
            <thead>
              <tr className={styles.theadRow}>
                <th className={styles.thFirst}>Nome</th>
                <th className={styles.th}>IP</th>
                {!compact && <th className={styles.th}>Modelo</th>}
                <th className={styles.th}>Departamento</th>
                <th className={styles.th}>Toner</th>
                <th className={styles.th}>Status</th>
                {!compact && <th className={styles.th}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id} onClick={() => onOpenDetails(p)} className={styles.row}>
                  <td className={styles.tdFirst}>
                    <div className={styles.nameCell}>
                      <div className={styles.iconWrap}>
                        <PrinterIcon size={16} />
                      </div>
                      <span className={styles.nameText}>{p.name}</span>
                    </div>
                  </td>
                  <td className={styles.td}>{p.ip}</td>
                  {!compact && (
                    <td className={styles.tdModel} title={p.model}>
                      {p.model}
                    </td>
                  )}
                  <td className={cn(styles.tdDept, compact ? styles.tdDeptCompact : styles.tdDeptFull)} title={p.department}>
                    {p.department}
                  </td>
                  <td className={styles.td}>
                    {p.toner ? (
                      <div className={styles.tonerRow} title={`${p.toner[0].label}: ${p.toner[0].percent}%`}>
                        <span className={styles.tonerDot} style={{ backgroundColor: tonerChannelColor(p.toner[0].color, theme) }} />
                        <span className={styles.tonerPercent} style={{ color: tonerLevelColor(p.toner[0].percent) }}>
                          {p.toner[0].percent}%
                        </span>
                        {p.toner[0].percent <= 20 && <TriangleAlert size={12} style={{ color: tonerLevelColor(p.toner[0].percent) }} />}
                      </div>
                    ) : (
                      <span className={styles.naText}>N/A</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <PrinterStatusBadge status={p.status} />
                  </td>
                  {!compact && (
                    <td className={styles.td}>
                      <div className={styles.actionsRow}>
                        <button onClick={() => onOpenDetails(p)} className={styles.actionButton} title="Detalhes">
                          <FileText size={15} />
                        </button>
                        <button onClick={(e) => handleWebAccess(p, e)} className={styles.actionButton} title="Acessar via web">
                          <Globe size={15} />
                        </button>
                        <button onClick={(e) => handleTestPage(p, e)} className={styles.actionButton} title="Imprimir teste">
                          <PrinterIcon size={15} />
                        </button>
                        <button onClick={(e) => handleSettings(p, e)} className={styles.actionButton} title="Configurações">
                          <Settings size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={compact ? 5 : 7} className={styles.emptyState}>
                    Nenhuma impressora encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.gridView}>
          {pageItems.map((p) => (
            <button key={p.id} onClick={() => onOpenDetails(p)} className={styles.gridCard}>
              <div className={styles.gridCardHead}>
                <div className={styles.gridCardHeadLeft}>
                  <div className={styles.gridCardIcon}>
                    <PrinterIcon size={16} />
                  </div>
                  <p className={styles.gridCardName}>{p.name}</p>
                </div>
                <PrinterStatusBadge status={p.status} />
              </div>
              <div className={styles.gridCardMeta}>
                <p>
                  {p.ip} · {p.model}
                </p>
                <p>{p.department}</p>
              </div>
              {p.toner && (
                <div className={styles.gridCardToner}>
                  <div className={styles.gridCardTonerTrack}>
                    <div
                      className={styles.gridCardTonerFill}
                      style={{ width: `${p.toner[0].percent}%`, backgroundColor: tonerChannelColor(p.toner[0].color, theme) }}
                    />
                  </div>
                  <p className={styles.gridCardTonerLabel} style={{ color: tonerLevelColor(p.toner[0].percent) }}>
                    {p.toner[0].label}: {p.toner[0].percent}%
                  </p>
                </div>
              )}
            </button>
          ))}
          {pageItems.length === 0 && <p className={styles.emptyState}>Nenhuma impressora encontrada com esses filtros.</p>}
        </div>
      )}

      <div className={styles.pagination}>
        <p className={styles.paginationInfo}>
          Mostrando {printers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{" "}
          {Math.min(currentPage * pageSize, printers.length)} de {printers.length} impressoras
        </p>
        <div className={styles.paginationControls}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={styles.pageArrow}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={cn(styles.pageNumber, n === currentPage && styles.pageNumberActive)}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={styles.pageArrow}
          >
            <ChevronRight size={16} />
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className={styles.pageSizeSelect}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
