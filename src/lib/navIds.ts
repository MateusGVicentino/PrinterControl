/**
 * Mapa de ids de navegação (herdados do antigo `activeNav` de App.tsx) para
 * rotas reais do App Router. Componentes como RightPanel/AlertBanner/
 * BottomCharts continuam chamando `onNavigate("toner")` etc. — as páginas
 * usam este mapa pra traduzir isso em `router.push()`.
 */
export const NAV_ROUTES: Record<string, string> = {
  dashboard: "/",
  printers: "/printers",
  toner: "/toner",
  alerts: "/alerts",
  reports: "/reports",
  history: "/history",
  network: "/network",
  users: "/users",
  notifications: "/notifications",
  integrations: "/integrations",
  settings: "/settings",
};
