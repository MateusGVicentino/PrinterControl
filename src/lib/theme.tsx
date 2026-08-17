/**
 * Dependência externa: react (Context API, mesmo padrão de lib/toast.tsx).
 * Alterna a classe `dark` na tag <html> (Tailwind v4 dark mode via
 * `@custom-variant dark` em index.css) e persiste a escolha em localStorage.
 * Sem preferência salva, cai no prefers-color-scheme do sistema.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "elgin_theme";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
