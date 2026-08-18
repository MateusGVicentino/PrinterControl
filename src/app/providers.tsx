"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "../lib/theme";
import { ToastProvider } from "../lib/toast";
import { AppDataProvider } from "../lib/app-data";
import AuthGate from "../components/AuthGate";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppDataProvider>
          <AuthGate>{children}</AuthGate>
        </AppDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
