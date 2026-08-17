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
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-bold text-ink">Impressoras</h3>
          <p className="text-[13px] text-ink-faint">
            {printers.length} de {totalCount} resultados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-ink-faint">
            <Search size={15} />
            <input
              value={filters.query}
              onChange={(e) => {
                onFilterChange("query", e.target.value);
                setPage(1);
              }}
              placeholder="Pesquisar..."
              className="w-36 bg-transparent text-ink placeholder:text-ink-faint focus:outline-none sm:w-44"
            />
          </div>
          <button
            onClick={() => setShowFilters((s) => !s)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              showFilters || filters.status !== "Todos" || filters.type !== "Todos"
                ? "border-brand/40 bg-brand-tint text-brand-700"
                : "border-border bg-surface-2 text-ink hover:bg-surface-sunken"
            }`}
          >
            <SlidersHorizontal size={15} />
            Filtros
          </button>
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1">
            <button
              onClick={() => setView("list")}
              className={`rounded-lg p-1.5 ${view === "list" ? "bg-brand text-white" : "text-ink-faint hover:text-ink"}`}
            >
              <Rows3 size={16} />
            </button>
            <button
              onClick={() => setView("grid")}
              className={`rounded-lg p-1.5 ${view === "grid" ? "bg-brand text-white" : "text-ink-faint hover:text-ink"}`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-5 border-b border-border bg-surface-2/60 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Status</span>
            <div className="flex gap-1.5">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange("status", opt.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    filters.status === opt.value ? "bg-brand text-white" : "bg-surface text-ink-soft hover:bg-surface-sunken"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Tipo</span>
            <div className="flex gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onFilterChange("type", opt.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
                    filters.type === opt.value ? "bg-brand text-white" : "bg-surface text-ink-soft hover:bg-surface-sunken"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className="overflow-x-auto">
          <table className={`w-full border-collapse text-sm ${compact ? "min-w-[560px]" : "min-w-[680px]"}`}>
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Nome</th>
                <th className="px-3 py-3">IP</th>
                {!compact && <th className="px-3 py-3">Modelo</th>}
                <th className="px-3 py-3">Departamento</th>
                <th className="px-3 py-3">Toner</th>
                <th className="px-3 py-3">Status</th>
                {!compact && <th className="px-3 py-3">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => onOpenDetails(p)}
                  className="cursor-pointer border-t border-border transition-colors hover:bg-surface-2"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
                        <PrinterIcon size={16} />
                      </div>
                      <span className="font-semibold text-ink">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-ink-soft">{p.ip}</td>
                  {!compact && (
                    <td className="max-w-[130px] truncate px-3 py-3.5 text-ink-soft" title={p.model}>
                      {p.model}
                    </td>
                  )}
                  <td className={`truncate px-3 py-3.5 text-ink-soft ${compact ? "max-w-[100px]" : "max-w-[120px]"}`} title={p.department}>
                    {p.department}
                  </td>
                  <td className="px-3 py-3.5">
                    {p.toner ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap" title={`${p.toner[0].label}: ${p.toner[0].percent}%`}>
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: tonerChannelColor(p.toner[0].color, theme) }} />
                        <span className="text-sm font-semibold" style={{ color: tonerLevelColor(p.toner[0].percent) }}>
                          {p.toner[0].percent}%
                        </span>
                        {p.toner[0].percent <= 20 && <TriangleAlert size={12} style={{ color: tonerLevelColor(p.toner[0].percent) }} />}
                      </div>
                    ) : (
                      <span className="text-ink-faint">N/A</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    <PrinterStatusBadge status={p.status} />
                  </td>
                  {!compact && (
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1 text-ink-faint">
                        <button onClick={() => onOpenDetails(p)} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" title="Detalhes">
                          <FileText size={15} />
                        </button>
                        <button onClick={(e) => handleWebAccess(p, e)} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" title="Acessar via web">
                          <Globe size={15} />
                        </button>
                        <button onClick={(e) => handleTestPage(p, e)} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" title="Imprimir teste">
                          <PrinterIcon size={15} />
                        </button>
                        <button onClick={(e) => handleSettings(p, e)} className="rounded-lg p-1.5 hover:bg-surface-sunken hover:text-ink" title="Configurações">
                          <Settings size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={compact ? 5 : 7} className="px-5 py-12 text-center text-ink-faint">
                    Nenhuma impressora encontrada com esses filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((p) => (
            <button
              key={p.id}
              onClick={() => onOpenDetails(p)}
              className="rounded-2xl border border-border bg-canvas p-4 text-left transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
                    <PrinterIcon size={16} />
                  </div>
                  <p className="text-sm font-semibold text-ink">{p.name}</p>
                </div>
                <PrinterStatusBadge status={p.status} />
              </div>
              <div className="mt-3 space-y-1 text-xs text-ink-faint">
                <p>
                  {p.ip} · {p.model}
                </p>
                <p>{p.department}</p>
              </div>
              {p.toner && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.toner[0].percent}%`, backgroundColor: tonerChannelColor(p.toner[0].color, theme) }}
                    />
                  </div>
                  <p className="mt-1 text-xs font-semibold" style={{ color: tonerLevelColor(p.toner[0].percent) }}>
                    {p.toner[0].label}: {p.toner[0].percent}%
                  </p>
                </div>
              )}
            </button>
          ))}
          {pageItems.length === 0 && (
            <p className="col-span-full py-12 text-center text-ink-faint">Nenhuma impressora encontrada com esses filtros.</p>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border p-4 sm:flex-row">
        <p className="text-[12px] text-ink-faint">
          Mostrando {printers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} a{" "}
          {Math.min(currentPage * pageSize, printers.length)} de {printers.length} impressoras
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-border p-1.5 text-ink-soft hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`h-8 w-8 rounded-lg text-sm font-medium ${
                n === currentPage ? "bg-brand text-white" : "text-ink-soft hover:bg-surface-2"
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-lg border border-border p-1.5 text-ink-soft hover:bg-surface-2 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm text-ink-soft focus:outline-none"
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
