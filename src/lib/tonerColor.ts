/**
 * Sem libs externas. Cores fixas por canal de toner (K/C/M/Y) — são cores
 * físicas do toner, não a cor de marca do site (--color-brand em index.css);
 * não trocar junto se mudar a identidade visual. O canal K (preto) muda
 * entre temas porque um preto quase puro sobre fundo escuro fica invisível.
 */
import type { TonerLevel } from "../types";

const CHANNEL_COLOR_LIGHT: Record<TonerLevel["color"], string> = {
  K: "#3a332c",
  C: "#3b8fc4",
  M: "#c74d8e",
  Y: "#d9a52e",
};

const CHANNEL_COLOR_DARK: Record<TonerLevel["color"], string> = {
  K: "#c9c0ae",
  C: "#5ab3e6",
  M: "#e07eb0",
  Y: "#e8bd5c",
};

export function tonerChannelColor(channel: TonerLevel["color"], theme: "light" | "dark" = "light"): string {
  return (theme === "dark" ? CHANNEL_COLOR_DARK : CHANNEL_COLOR_LIGHT)[channel];
}

export function tonerLevelColor(percent: number): string {
  if (percent <= 15) return "var(--color-critical)";
  if (percent <= 35) return "var(--color-warning)";
  return "var(--color-success)";
}
