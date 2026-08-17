/**
 * Sem libs externas. Recharts recebe stroke/fill como string literal (não
 * lê custom properties do CSS de forma confiável em todos os navegadores),
 * então os componentes de gráfico (BottomCharts, Sidebar) não podem usar só
 * classes Tailwind para cor — precisam do hex resolvido pelo tema atual.
 * Mantém a paleta em sincronia com os tokens .dark de src/index.css.
 */
export interface ChartColors {
  brand: string;
  grid: string;
  axis: string;
  tickText: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipLabel: string;
  warning: string;
  surfaceSunken: string;
}

const LIGHT: ChartColors = {
  brand: "#0098e0",
  grid: "#e7dfd2",
  axis: "#a79b8b",
  tickText: "#6f6459",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e7dfd2",
  tooltipLabel: "#26211c",
  warning: "#c8862e",
  surfaceSunken: "#ece5da",
};

const DARK: ChartColors = {
  brand: "#22b3ff",
  grid: "#39342b",
  axis: "#8c8474",
  tickText: "#b8ae9a",
  tooltipBg: "#221e17",
  tooltipBorder: "#39342b",
  tooltipLabel: "#f5f0e6",
  warning: "#fbbf24",
  surfaceSunken: "#2f2921",
};

export function getChartColors(theme: "light" | "dark"): ChartColors {
  return theme === "dark" ? DARK : LIGHT;
}
