/**
 * Dependências externas: react (Context API, para não precisar passar
 * `push()` por props em toda a árvore) e lucide-react (ícones do toast).
 * `ToastProvider` deve envolver o app (ver main.tsx); `useToast()` dá acesso
 * ao `push()` em qualquer componente filho.
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

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
  success: "text-success",
  info: "text-info",
  warning: "text-warning",
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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:right-4 sm:left-auto">
        {toasts.map((t) => {
          const Icon = VARIANT_ICON[t.variant];
          return (
            <div
              key={t.id}
              className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-lg"
            >
              <Icon size={19} className={`mt-0.5 shrink-0 ${VARIANT_COLOR[t.variant]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.description && <p className="mt-0.5 text-[13px] leading-snug text-ink-soft">{t.description}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-lg p-1 text-ink-faint hover:bg-surface-2 hover:text-ink"
                aria-label="Fechar notificação"
              >
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
