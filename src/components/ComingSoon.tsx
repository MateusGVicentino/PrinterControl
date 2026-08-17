// Dependência externa: só o tipo LucideIcon (lucide-react), para tipar o
// ícone recebido por prop. Placeholder genérico usado pelas seções ainda
// não implementadas (Histórico, Rede, Usuários, etc. — ver COMING_SOON em App.tsx).
import type { LucideIcon } from "lucide-react";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-20 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-tint text-brand-700">
        <Icon size={26} />
      </div>
      <h2 className="mt-5 text-lg font-bold text-ink">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-faint">{description}</p>
    </div>
  );
}
