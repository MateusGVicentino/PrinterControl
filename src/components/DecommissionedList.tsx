/**
 * Sem libs externas. Lista da aba "Devolvidas" da planilha — impressoras
 * retiradas de operação, em estoque ou backup. Dados incompletos na fonte
 * (muitas linhas sem data de devolução) — mostramos "—" quando falta.
 */
import { ArchiveRestore } from "lucide-react";
import type { DecommissionedPrinter } from "../data/printers";

interface DecommissionedListProps {
  data: DecommissionedPrinter[];
}

export default function DecommissionedList({ data }: DecommissionedListProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-2 text-ink-faint">
          <ArchiveRestore size={17} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Impressoras Devolvidas / Fora de Operação</h2>
          <p className="text-sm text-ink-faint">{data.length} equipamentos — estoque, backup ou retirados do parque ativo.</p>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              <th className="bg-surface-2 px-4 py-2.5">Modelo</th>
              <th className="bg-surface-2 px-4 py-2.5">Departamento / Origem</th>
              <th className="bg-surface-2 px-4 py-2.5">Serial</th>
              <th className="bg-surface-2 px-4 py-2.5">IP / Situação</th>
              <th className="bg-surface-2 px-4 py-2.5">Data</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={`${p.serial}-${i}`} className="border-t border-border">
                <td className="px-4 py-2.5 font-medium text-ink">{p.model}</td>
                <td className="px-4 py-2.5 text-ink-soft">{p.department}</td>
                <td className="px-4 py-2.5 text-ink-faint">{p.serial}</td>
                <td className="px-4 py-2.5 text-ink-soft">{p.ip}</td>
                <td className="px-4 py-2.5 text-ink-faint">{p.date ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
