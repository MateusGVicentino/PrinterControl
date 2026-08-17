/**
 * Dependências externas: react (useRef/useEffect para fechar os dropdowns
 * ao clicar fora) e lucide-react (ícones). Busca/CSV/Escanear/Logout são
 * todos callbacks vindos de App.tsx — este componente não tem lógica de
 * negócio própria, só UI e o estado local dos menus (aberto/fechado).
 */
import { useEffect, useRef, useState } from "react";
import { Search, Bell, Download, RadioTower, ChevronDown, Menu, LogOut, Settings, User, Loader2, TriangleAlert, Sun, Moon } from "lucide-react";
import type { Account } from "../data/accounts";
import type { Alert } from "../types";
import { useTheme } from "../lib/theme";

interface TopbarProps {
  account: Account;
  onOpenMobileMenu: () => void;
  alerts: Alert[];
  query: string;
  onQueryChange: (value: string) => void;
  onExportCsv: () => void;
  onScan: () => void;
  scanning: boolean;
  onLogout: () => void;
  onSelectAlert: (alert: Alert) => void;
}

export default function Topbar({
  account,
  onOpenMobileMenu,
  alerts,
  query,
  onQueryChange,
  onExportCsv,
  onScan,
  scanning,
  onLogout,
  onSelectAlert,
}: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleShortcut(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, []);

  const firstName = account.name.split(" ")[0];
  const initials = account.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const emailDisplay = `${account.email}@elgin.com`;

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b border-border bg-canvas/90 px-5 py-4 backdrop-blur-md sm:px-8">
      <button onClick={onOpenMobileMenu} className="rounded-lg p-2 text-ink-soft hover:bg-surface-2 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1 lg:flex-none">
        <h1 className="truncate text-lg font-extrabold text-ink sm:text-xl lg:text-[22px]">Olá, {firstName}</h1>
        <p className="truncate text-sm text-ink-faint">Aqui está o status das impressoras da sua rede</p>
      </div>

      <div className="order-3 w-full lg:order-none lg:mx-4 lg:max-w-md lg:flex-1">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-faint shadow-xs transition-colors focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15">
          <Search size={16} className="shrink-0 text-ink-faint" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Pesquisar impressora, IP, modelo..."
            className="w-full bg-transparent text-ink placeholder:text-ink-faint focus:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-border px-1.5 py-0.5 text-[11px] font-medium text-ink-faint sm:inline">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={toggleTheme}
          className="rounded-xl border border-border bg-surface p-2.5 text-ink-soft shadow-xs transition-colors hover:bg-surface-2"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-xl border border-border bg-surface p-2.5 text-ink-soft shadow-xs transition-colors hover:bg-surface-2"
          >
            <Bell size={18} />
            {alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-critical text-[11px] font-bold text-white ring-2 ring-canvas">
                {alerts.length}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-ink">Notificações</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-faint">Tudo certo por aqui.</p>
                ) : (
                  alerts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        onSelectAlert(a);
                        setNotifOpen(false);
                      }}
                      className="flex w-full items-start gap-2.5 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-surface-2"
                    >
                      <TriangleAlert size={15} className={`mt-0.5 shrink-0 ${a.severity === "critical" ? "text-critical" : "text-warning"}`} />
                      <div className="min-w-0">
                        <p className="text-[13px] leading-snug text-ink">{a.message}</p>
                        <p className="mt-0.5 text-[11px] text-ink-faint">{a.timestamp}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onExportCsv}
          className="hidden items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 md:flex"
        >
          <Download size={16} />
          Exportar CSV
        </button>

        <button
          onClick={onScan}
          disabled={scanning}
          className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70 md:flex"
        >
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <RadioTower size={16} />}
          {scanning ? "Escaneando..." : "Escanear Rede"}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-2.5 shadow-xs transition-colors hover:bg-surface-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-xs font-bold text-white">{initials}</div>
            <div className="hidden text-left leading-tight sm:block">
              <p className="text-sm font-semibold text-ink">{account.name}</p>
              <p className="text-[11px] text-ink-faint">{emailDisplay}</p>
            </div>
            <ChevronDown size={14} className={`hidden text-ink-faint transition-transform sm:block ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">{account.name}</p>
                <p className="text-xs text-ink-faint">{emailDisplay}</p>
              </div>
              <div className="flex flex-col p-1.5">
                <button className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-2">
                  <User size={15} className="text-ink-faint" />
                  Meu perfil
                </button>
                <button className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm text-ink-soft hover:bg-surface-2">
                  <Settings size={15} className="text-ink-faint" />
                  Configurações
                </button>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium text-critical hover:bg-critical-tint"
                >
                  <LogOut size={15} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
