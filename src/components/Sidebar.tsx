/**
 * Dependências externas: react, next/navigation (rota ativa), next/link
 * (navegação), recharts (sparkline "Rede Monitorada" — dado fictício em
 * data/printers.ts, não vem de coleta real) e lucide-react.
 * Filtros (status/tipo/departamento) e contagem de alertas vêm do
 * AppDataProvider (lib/app-data.tsx) — Sidebar só lê e dispara updateFilter.
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import {
  LayoutDashboard,
  Printer,
  Droplet,
  AlertTriangle,
  FileBarChart2,
  History,
  Network,
  UserCog,
  Bell,
  Plug,
  Settings,
  LifeBuoy,
  Menu,
} from "lucide-react";
import { networkHistory } from "../data/printers";
import ElginLogo from "./ElginLogo";
import { useTheme } from "../lib/theme";
import { getChartColors } from "../lib/chartColors";
import { useAppData } from "../lib/app-data";
import { cn } from "../lib/cn";
import styles from "./Sidebar.module.css";

const sparkData = networkHistory.map((v, i) => ({ i, v }));

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
  badge?: number;
  onNavigate: () => void;
}

function NavItem({ icon, label, href, active, badge, onNavigate }: NavItemProps) {
  return (
    <Link href={href} onClick={onNavigate} className={cn(styles.navItem, active ? styles.navItemActive : styles.navItemInactive)}>
      <span className={active ? styles.navIconActive : styles.navIconInactive}>{icon}</span>
      <span className={styles.navLabel}>{label}</span>
      {badge ? <span className={cn(styles.badge, active ? styles.badgeActive : styles.badgeInactive)}>{badge}</span> : null}
    </Link>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onNavigate: () => void;
  onOpenHelp: () => void;
}

export default function Sidebar({ mobileOpen, onCloseMobile, onNavigate, onOpenHelp }: SidebarProps) {
  const { theme } = useTheme();
  const chartColors = getChartColors(theme);
  const pathname = usePathname();
  const { alerts } = useAppData();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));


  return (
    <>
      {mobileOpen && <div className={styles.backdrop} onClick={onCloseMobile} />}
      <aside className={cn(styles.aside, mobileOpen ? styles.asideOpen : styles.asideClosed)}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <ElginLogo height={29} />
            <p className={styles.logoSubtitle}>Impressoras</p>
          </div>
          <button onClick={onCloseMobile} className={styles.closeButton}>
            <Menu size={18} />
          </button>
        </div>

        <div className={styles.scrollArea}>
          <p className={styles.sectionLabel}>MONITORAMENTO</p>
          <nav className={styles.nav}>
            <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" href="/" active={isActive("/")} onNavigate={onNavigate} />
            <NavItem icon={<Printer size={18} />} label="Impressoras" href="/printers" active={isActive("/printers")} onNavigate={onNavigate} />
            <NavItem icon={<Droplet size={18} />} label="Suprimentos" href="/toner" active={isActive("/toner")} onNavigate={onNavigate} />
            <NavItem
              icon={<AlertTriangle size={18} />}
              label="Alertas"
              href="/alerts"
              badge={alerts.length}
              active={isActive("/alerts")}
              onNavigate={onNavigate}
            />
            <NavItem icon={<FileBarChart2 size={18} />} label="Relatórios" href="/reports" active={isActive("/reports")} onNavigate={onNavigate} />
            <NavItem icon={<History size={18} />} label="Histórico" href="/history" active={isActive("/history")} onNavigate={onNavigate} />
            <NavItem icon={<Network size={18} />} label="Mapeamento de Rede" href="/network" active={isActive("/network")} onNavigate={onNavigate} />
          </nav>

          <p className={cn(styles.sectionLabel, styles.sectionLabelSpaced)}>CONFIGURAÇÕES</p>
          <nav className={styles.nav}>
            <NavItem icon={<UserCog size={18} />} label="Usuários" href="/users" active={isActive("/users")} onNavigate={onNavigate} />
            <NavItem icon={<Bell size={18} />} label="Notificações" href="/notifications" active={isActive("/notifications")} onNavigate={onNavigate} />
            <NavItem icon={<Plug size={18} />} label="Integrações" href="/integrations" active={isActive("/integrations")} onNavigate={onNavigate} />
            <NavItem icon={<Settings size={18} />} label="Configurações" href="/settings" active={isActive("/settings")} onNavigate={onNavigate} />
          </nav>
        </div>

        <div className={styles.bottom}>
          <div className={styles.networkCard}>
            <p className={styles.networkTitle}>Rede Monitorada</p>
            <p className={styles.networkValue}>10.0.0.0/24</p>
            <div className={styles.sparkWrap}>
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
            <div className={styles.networkMeta}>
              <p>Versão 2.0.1</p>
              <p>Última atualização</p>
              <p className={styles.networkMetaSoft}>17/08/2026 12:30:07</p>
            </div>
          </div>

          <button onClick={onOpenHelp} className={styles.helpButton}>
            <LifeBuoy size={16} />
            Central de Ajuda
          </button>
        </div>
      </aside>
    </>
  );
}
