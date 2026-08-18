"use client";

import type { ReactNode } from "react";
import { useAppData } from "../lib/app-data";
import Login from "./Login";
import AppShell from "./AppShell";

export default function AuthGate({ children }: { children: ReactNode }) {
  const { account, handleLoginSuccess } = useAppData();

  if (!account) {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  return <AppShell>{children}</AppShell>;
}
