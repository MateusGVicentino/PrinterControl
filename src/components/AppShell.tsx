/**
 * Casco fixo do painel (sidebar + topbar + rodapé + modais globais) que
 * envolve o conteúdo de cada rota — equivalente ao JSX que antes ficava em
 * torno do `switch` de `activeNav` em App.tsx. `mobileMenuOpen` e `helpOpen`
 * são estado só de "chrome" da UI, não precisam estar no AppDataProvider.
 */
"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Mail, MessageCircle, LifeBuoy } from "lucide-react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import PrinterDetailsModal from "./PrinterDetailsModal";
import Modal from "./Modal";
import { useAppData } from "../lib/app-data";
import { useToast } from "../lib/toast";
import styles from "./AppShell.module.css";

export default function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const pathname = usePathname();
  const { usingRealData, usingRealMonthlyReport, selectedPrinter, setSelectedPrinter } = useAppData();
  const { push } = useToast();

  return (
    <div className={styles.shell}>
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onNavigate={() => setMobileMenuOpen(false)}
        onOpenHelp={() => setHelpOpen(true)}
      />

      <div className={styles.main}>
        <Topbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className={styles.content}>
          <div key={pathname} className={`${styles.view} animate-view-in`}>
            {children}
          </div>
        </main>

        <footer className={styles.footer}>
          <p>Elgin Impressoras © 2026 — Todos os direitos reservados</p>
          <div className={styles.footerStatus}>
            <p className={styles.footerStatusItem}>
              <span className={`${styles.statusDot} ${usingRealData ? styles.statusDotOn : styles.statusDotOff}`} />
              {usingRealData ? "Conectado ao servidor" : "Modo demonstração (dados fictícios)"}
            </p>
            <p className={styles.footerStatusItem}>
              <span className={`${styles.statusDot} ${usingRealMonthlyReport ? styles.statusDotOn : styles.statusDotOff}`} />
              {usingRealMonthlyReport ? "Relatório mensal real" : "Relatório mensal de demonstração"}
            </p>
          </div>
        </footer>
      </div>

      <PrinterDetailsModal printer={selectedPrinter} onClose={() => setSelectedPrinter(null)} />

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title="Central de Ajuda" subtitle="Estamos aqui para ajudar">
        <div className={styles.helpList}>
          <a href="mailto:ti@elgin.com.br" className={styles.helpItem}>
            <Mail size={18} className={styles.helpIcon} />
            <div>
              <p className={styles.helpItemTitle}>Enviar e-mail para o suporte</p>
              <p className={styles.helpItemSubtitle}>ti@elgin.com.br</p>
            </div>
          </a>
          <button
            onClick={() => {
              setHelpOpen(false);
              push({ variant: "info", title: "Chat indisponível", description: "O chat de suporte ao vivo chega em breve." });
            }}
            className={`${styles.helpItem} ${styles.helpItemButton}`}
          >
            <MessageCircle size={18} className={styles.helpIcon} />
            <div>
              <p className={styles.helpItemTitle}>Abrir chat de suporte</p>
              <p className={styles.helpItemSubtitle}>Em breve</p>
            </div>
          </button>
          <div className={styles.helpNote}>
            <LifeBuoy size={18} className={styles.helpNoteIcon} />
            <p className={styles.helpNoteText}>
              Script de coleta e documentação em <code className={styles.helpCode}>scripts/Coletar-Impressoras.ps1</code>.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
