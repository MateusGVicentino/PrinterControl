/**
 * Dependências externas: react (useRef/useEffect para fechar os dropdowns
 * ao clicar fora) e lucide-react (ícones). Busca/CSV/Escanear/Logout vêm do
 * AppDataProvider (lib/app-data.tsx) — este componente não tem lógica de
 * negócio própria, só UI e o estado local dos menus (aberto/fechado).
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Bell, Download, RadioTower, ChevronDown, Menu, LogOut, Settings, User, Loader2, TriangleAlert, Sun, Moon } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useAppData } from "../lib/app-data";
import { useToast } from "../lib/toast";
import { exportPrintersCsv } from "../lib/exportCsv";
import { cn } from "../lib/cn";
import styles from "./Topbar.module.css";

export default function Topbar({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { account, alerts, filters, updateFilter, handleScan, scanning, handleLogout, handleAlertSelect, filteredPrinters } = useAppData();
  const { push } = useToast();
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

  if (!account) return null;

  const firstName = account.name.split(" ")[0];
  const initials = account.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const emailDisplay = `${account.email}@elgin.com`;

  function onExportCsv() {
    exportPrintersCsv(filteredPrinters);
    push({ variant: "success", title: "CSV exportado", description: `${filteredPrinters.length} impressora(s) incluída(s) no arquivo.` });
  }

  return (
    <header className={styles.header}>
      <button onClick={onOpenMobileMenu} className={styles.menuButton}>
        <Menu size={20} />
      </button>

      <div className={styles.greeting}>
        <h1 className={styles.greetingTitle}>Olá, {firstName}</h1>
        <p className={styles.greetingSubtitle}>Aqui está o status das impressoras da sua rede</p>
      </div>

      <div className={styles.searchWrap}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            ref={searchRef}
            type="text"
            value={filters.query}
            onChange={(e) => updateFilter("query", e.target.value)}
            placeholder="Pesquisar impressora, IP, modelo..."
            className={styles.searchInput}
          />
          <kbd className={styles.searchKbd}>Ctrl K</kbd>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          onClick={toggleTheme}
          className={styles.iconButton}
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
          title={theme === "dark" ? "Modo claro" : "Modo escuro"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className={styles.dropdownAnchor} ref={notifRef}>
          <button onClick={() => setNotifOpen((o) => !o)} className={cn(styles.iconButton, styles.relative)}>
            <Bell size={18} />
            {alerts.length > 0 && <span className={styles.notifBadge}>{alerts.length}</span>}
          </button>
          {notifOpen && (
            <div className={cn(styles.dropdown, styles.dropdownNotif)}>
              <div className={styles.dropdownHeader}>
                <p className={styles.dropdownHeaderTitle}>Notificações</p>
              </div>
              <div className={styles.notifList}>
                {alerts.length === 0 ? (
                  <p className={styles.notifEmpty}>Tudo certo por aqui.</p>
                ) : (
                  alerts.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        handleAlertSelect(a);
                        setNotifOpen(false);
                      }}
                      className={styles.notifItem}
                    >
                      <TriangleAlert size={15} className={cn(styles.notifIcon, a.severity === "critical" ? styles.textCritical : styles.textWarning)} />
                      <div className={styles.notifBody}>
                        <p className={styles.notifMessage}>{a.message}</p>
                        <p className={styles.notifTimestamp}>{a.timestamp}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={onExportCsv} className={cn(styles.textButton, styles.exportButton)}>
          <Download size={16} />
          Exportar CSV
        </button>

        <button onClick={handleScan} disabled={scanning} className={cn(styles.textButton, styles.scanButton)}>
          {scanning ? <Loader2 size={16} className="animate-spin" /> : <RadioTower size={16} />}
          {scanning ? "Escaneando..." : "Escanear Rede"}
        </button>

        <div className={styles.dropdownAnchor} ref={menuRef}>
          <button onClick={() => setMenuOpen((o) => !o)} className={styles.accountButton}>
            <div className={styles.avatar}>{initials}</div>
            <div className={styles.accountText}>
              <p className={styles.accountName}>{account.name}</p>
              <p className={styles.accountEmail}>{emailDisplay}</p>
            </div>
            <ChevronDown size={14} className={cn(styles.chevron, menuOpen && styles.chevronOpen)} />
          </button>

          {menuOpen && (
            <div className={cn(styles.dropdown, styles.dropdownMenu)}>
              <div className={styles.dropdownHeader}>
                <p className={styles.menuAccountName}>{account.name}</p>
                <p className={styles.menuAccountEmail}>{emailDisplay}</p>
              </div>
              <div className={styles.menuList}>
                <button className={styles.menuItem}>
                  <User size={15} className={styles.menuItemIcon} />
                  Meu perfil
                </button>
                <button className={styles.menuItem}>
                  <Settings size={15} className={styles.menuItemIcon} />
                  Configurações
                </button>
                <button onClick={handleLogout} className={cn(styles.menuItem, styles.menuItemDanger)}>
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
