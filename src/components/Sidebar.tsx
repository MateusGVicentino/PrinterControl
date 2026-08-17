/**
 * Dependências externas: react, recharts (sparkline "Rede Monitorada" —
 * dado fictício em data/printers.ts, não vem de coleta real) e lucide-react.
 * Nav + filtros (status/tipo/departamento) — os filtros são só a UI; quem
 * guarda o estado e decide o que filtrar é App.tsx (lib/filterPrinters.ts).
 */
import { useState } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard,
  Printer,
  Droplet,
  AlertTriangle,
  FileBarChart2,
  History,
  Network,
  Users2,
  UserCog,
  Bell,
  Plug,
  Settings,
  LifeBuoy,
  Menu,
} from "lucide-react";
import { networkHistory } from "../data/printers";
import type { PrinterFilters } from "../lib/filterPrinters";
import type { PrinterStatus } from "../types";
import type { PrinterType } from "../lib/printerType";
import ElginLogo from "./ElginLogo";
import { useTheme } from "../lib/theme";
import { getChartColors } from "../lib/chartColors";

const sparkData = networkHistory.map((v, i) => ({ i, v }));

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ icon, label, active, badge, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
        active ? "bg-brand text-white shadow-sm" : "text-ink-soft hover:bg-surface-2"
      }`}
    >
      <span className={active ? "text-white" : "text-ink-faint group-hover:text-ink-soft"}>{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge ? (
        <span
          className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
            active ? "bg-white/25 text-white" : "bg-critical text-white"
          }`}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
        active ? "bg-brand text-white" : "bg-surface-2 text-ink-soft hover:bg-surface-sunken"
      }`}
    >
      {label}
    </button>
  );
}

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  alertCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  filters: PrinterFilters;
  onFilterChange: <K extends keyof PrinterFilters>(key: K, value: PrinterFilters[K]) => void;
  departments: string[];
  onOpenHelp: () => void;
}

export default function Sidebar({
  active,
  onNavigate,
  alertCount,
  mobileOpen,
  onCloseMobile,
  filters,
  onFilterChange,
  departments,
  onOpenHelp,
}: SidebarProps) {
  const [showDepartments, setShowDepartments] = useState(false);
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);

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
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />}
      <aside
        className={`fixed z-50 flex h-screen w-[272px] shrink-0 flex-col border-r border-border bg-surface transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <div className="leading-tight">
            <ElginLogo height={29} />
            <p className="mt-0.5 text-[11px] font-medium text-ink-faint">Impressoras</p>
          </div>
          <button onClick={onCloseMobile} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 lg:hidden">
            <Menu size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold tracking-wider text-ink-faint">MONITORAMENTO</p>
          <nav className="flex flex-col gap-1">
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active={active === "dashboard"} onClick={() => onNavigate("dashboard")} />
            <NavItem icon={<Printer size={18} />} label="Impressoras" active={active === "printers"} onClick={() => onNavigate("printers")} />
            <NavItem icon={<Droplet size={18} />} label="Suprimentos" active={active === "toner"} onClick={() => onNavigate("toner")} />
            <NavItem icon={<AlertTriangle size={18} />} label="Alertas" badge={alertCount} active={active === "alerts"} onClick={() => onNavigate("alerts")} />
            <NavItem icon={<FileBarChart2 size={18} />} label="Relatórios" active={active === "reports"} onClick={() => onNavigate("reports")} />
            <NavItem icon={<History size={18} />} label="Histórico" active={active === "history"} onClick={() => onNavigate("history")} />
            <NavItem icon={<Network size={18} />} label="Mapeamento de Rede" active={active === "network"} onClick={() => onNavigate("network")} />
          </nav>

          <p className="px-3 pb-2 pt-6 text-[11px] font-bold tracking-wider text-ink-faint">STATUS</p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {statusOptions.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={filters.status === opt.value} onClick={() => onFilterChange("status", opt.value)} />
            ))}
          </div>

          <p className="px-3 pb-2 pt-5 text-[11px] font-bold tracking-wider text-ink-faint">TIPO</p>
          <div className="flex flex-wrap gap-1.5 px-1">
            {typeOptions.map((opt) => (
              <Pill key={opt.value} label={opt.label} active={filters.type === opt.value} onClick={() => onFilterChange("type", opt.value)} />
            ))}
          </div>

          <button
            onClick={() => setShowDepartments((s) => !s)}
            className="mt-5 flex w-full items-center gap-2 px-3 pb-2 text-[11px] font-bold tracking-wider text-ink-faint"
          >
            <Users2 size={12} />
            DEPARTAMENTOS {filters.department !== "Todos" && `· ${filters.department}`}
          </button>
          {showDepartments && (
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto px-1 pb-1">
              <Pill label="Todos" active={filters.department === "Todos"} onClick={() => onFilterChange("department", "Todos")} />
              {departments.map((d) => (
                <Pill key={d} label={d} active={filters.department === d} onClick={() => onFilterChange("department", d)} />
              ))}
            </div>
          )}

          <p className="px-3 pb-2 pt-6 text-[11px] font-bold tracking-wider text-ink-faint">CONFIGURAÇÕES</p>
          <nav className="flex flex-col gap-1">
            <NavItem icon={<UserCog size={18} />} label="Usuários" active={active === "users"} onClick={() => onNavigate("users")} />
            <NavItem icon={<Bell size={18} />} label="Notificações" active={active === "notifications"} onClick={() => onNavigate("notifications")} />
            <NavItem icon={<Plug size={18} />} label="Integrações" active={active === "integrations"} onClick={() => onNavigate("integrations")} />
            <NavItem icon={<Settings size={18} />} label="Configurações" active={active === "settings"} onClick={() => onNavigate("settings")} />
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-4">
          <div className="rounded-2xl bg-surface-2 p-4">
            <p className="text-xs font-semibold text-brand-700">Rede Monitorada</p>
            <p className="mt-1 text-lg font-bold text-ink">10.0.0.0/24</p>
            <div className="-mx-1 -my-1 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.brand} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={chartColors.brand} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="v" stroke={chartColors.brand} strokeWidth={2} fill="url(#sparkFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-ink-faint">
              <p>Versão 2.0.1</p>
              <p>Última atualização</p>
              <p className="text-ink-soft">17/08/2026 12:30:07</p>
            </div>
          </div>

          <button
            onClick={onOpenHelp}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-2"
          >
            <LifeBuoy size={16} />
            Central de Ajuda
          </button>
        </div>
      </aside>
    </>
  );
}
