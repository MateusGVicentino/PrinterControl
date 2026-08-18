/**
 * Dependências externas: react (Context API, para não precisar passar
 * `push()` por props em toda a árvore) e lucide-react (ícones do toast).
 * `ToastProvider` deve envolver o app (ver app/providers.tsx); `useToast()`
 * dá acesso ao `push()` em qualquer componente filho.
 */
"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import styles from "./toast.module.css";
import { cn } from "./cn";

type ToastVariant = "success" | "info" | "warning";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
}

interface ToastContextValue {
  push: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICON: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warning: TriangleAlert,
};

const VARIANT_COLOR: Record<ToastVariant, string> = {
  success: styles.iconSuccess,
  info: styles.iconInfo,
  warning: styles.iconWarning,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4200);
  }, []);

  function dismiss(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className={cn(styles.container)}>
        {toasts.map((t) => {
          const Icon = VARIANT_ICON[t.variant];
          return (
            <div key={t.id} className={cn(styles.toast, "animate-toast-in")}>
              <Icon size={19} className={cn(styles.icon, VARIANT_COLOR[t.variant])} />
              <div className={styles.body}>
                <p className={styles.title}>{t.title}</p>
                {t.description && <p className={styles.description}>{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className={styles.close} aria-label="Fechar notificação">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
