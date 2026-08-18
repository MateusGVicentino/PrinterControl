"use client";

/**
 * Dependências externas: react (useEffect, para o listener de Escape) e
 * lucide-react (ícone de fechar). Modal genérico reutilizável — quem monta
 * o conteúdo é o caller (ver PrinterDetailsModal.tsx e o modal de Ajuda em
 * AppShell.tsx); este componente só cuida de overlay, Escape e clique fora.
 *
 * `maxWidth` agora é um valor de CSS (ex.: "36rem"), não mais uma classe
 * Tailwind — callers que passavam "max-w-xl" etc. precisam passar o rem
 * equivalente (max-w-lg=32rem, max-w-xl=36rem, max-w-2xl=42rem).
 */
import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import styles from "./Modal.module.css";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export default function Modal({ open, onClose, title, subtitle, children, footer, maxWidth = "32rem" }: ModalProps) {
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
    <div className={styles.overlay}>
      <div className={`${styles.backdrop} animate-overlay-in`} onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`${styles.dialog} animate-modal-in`}
        style={{ maxWidth }}
      >
        <div className={styles.header}>
          <div>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button onClick={onClose} className={styles.closeButton} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
