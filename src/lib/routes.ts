/**
 * Mapa de ids de navegação (mesmos ids que existiam em `activeNav` na versão
 * SPA) para rotas reais do Next.js. Usado onde um componente filho (ex.:
 * RightPanel) ainda expõe um callback `onNavigate(id: string)` genérico.
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
