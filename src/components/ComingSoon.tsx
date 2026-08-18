// Dependência externa: só o tipo LucideIcon (lucide-react), para tipar o
// ícone recebido por prop. Placeholder genérico usado pelas seções ainda
// não implementadas (Histórico, Rede, Usuários, etc.).
import type { LucideIcon } from "lucide-react";
import styles from "./ComingSoon.module.css";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.iconWrap}>
        <Icon size={26} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
