/**
 * Sem libs externas. Lista da aba "Devolvidas" da planilha — impressoras
 * retiradas de operação, em estoque ou backup. Dados incompletos na fonte
 * (muitas linhas sem data de devolução) — mostramos "—" quando falta.
 */
import { ArchiveRestore } from "lucide-react";
import type { DecommissionedPrinter } from "../data/printers";
import styles from "./DecommissionedList.module.css";

interface DecommissionedListProps {
  data: DecommissionedPrinter[];
}

export default function DecommissionedList({ data }: DecommissionedListProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          <ArchiveRestore size={17} />
        </div>
        <div>
          <h2 className={styles.title}>Impressoras Devolvidas / Fora de Operação</h2>
          <p className={styles.subtitle}>{data.length} equipamentos — estoque, backup ou retirados do parque ativo.</p>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Modelo</th>
              <th className={styles.th}>Departamento / Origem</th>
              <th className={styles.th}>Serial</th>
              <th className={styles.th}>IP / Situação</th>
              <th className={styles.th}>Data</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={`${p.serial}-${i}`} className={styles.tr}>
                <td className={`${styles.td} ${styles.tdModel}`}>{p.model}</td>
                <td className={`${styles.td} ${styles.tdSoft}`}>{p.department}</td>
                <td className={`${styles.td} ${styles.tdFaint}`}>{p.serial}</td>
                <td className={`${styles.td} ${styles.tdSoft}`}>{p.ip}</td>
                <td className={`${styles.td} ${styles.tdFaint}`}>{p.date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
