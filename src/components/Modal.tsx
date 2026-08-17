/**
 * Dependências externas: react (useEffect, para o listener de Escape) e
 * lucide-react (ícone de fechar). Modal genérico reutilizável — quem monta
 * o conteúdo é o caller (ver PrinterDetailsModal.tsx e o modal de Ajuda em
 * App.tsx); este componente só cuida de overlay, Escape e clique fora.
 */
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div
        className="animate-overlay-in absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`animate-modal-in relative w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-ink">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-[13px] text-ink-soft">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-surface-2 hover:text-ink"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2.5 border-t border-border px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
