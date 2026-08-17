// Dependência externa: só lucide-react (ícones). Cards clicáveis — clicar
// aplica o filtro de status correspondente (mesmo estado do Sidebar).
import { Printer, Wifi, WifiOff, TriangleAlert } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  sublabel: string;
  icon: React.ReactNode;
  tone: "brand" | "success" | "critical" | "warning";
  active?: boolean;
  onClick?: () => void;
}

const TONE = {
  brand: { icon: "bg-brand-tint text-brand-700", ring: "ring-brand/30" },
  success: { icon: "bg-success-tint text-success", ring: "ring-success/30" },
  critical: { icon: "bg-critical-tint text-critical", ring: "ring-critical/30" },
  warning: { icon: "bg-warning-tint text-warning", ring: "ring-warning/30" },
};

function StatCard({ label, value, sublabel, icon, tone, active, onClick }: StatCardProps) {
  const t = TONE[tone];
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col items-start rounded-2xl border bg-surface p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? `border-transparent ring-2 ${t.ring}` : "border-border"
      }`}
    >
      <div className="flex w-full items-start justify-between">
        <p className="text-[13px] font-semibold text-ink-soft">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.icon}`}>{icon}</div>
      </div>
      <p className="mt-3 text-[2.25rem] font-extrabold leading-none tracking-tight text-ink">{value}</p>
      <p className="mt-1.5 text-[13px] text-ink-faint">{sublabel}</p>
    </button>
  );
}

interface StatCardsProps {
  total: number;
  online: number;
  offline: number;
  attention: number;
  activeStatus: "Todos" | "online" | "offline" | "atencao";
  onSelectStatus: (status: "Todos" | "online" | "offline" | "atencao") => void;
}

export default function StatCards({ total, online, offline, attention, activeStatus, onSelectStatus }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total"
        value={total}
        sublabel="Impressoras detectadas"
        icon={<Printer size={19} />}
        tone="brand"
        active={activeStatus === "Todos"}
        onClick={() => onSelectStatus("Todos")}
      />
      <StatCard
        label="Online"
        value={online}
        sublabel="Impressoras online"
        icon={<Wifi size={19} />}
        tone="success"
        active={activeStatus === "online"}
        onClick={() => onSelectStatus("online")}
      />
      <StatCard
        label="Offline"
        value={offline}
        sublabel="Impressoras offline"
        icon={<WifiOff size={19} />}
        tone="critical"
        active={activeStatus === "offline"}
        onClick={() => onSelectStatus("offline")}
      />
      <StatCard
        label="Atenção"
        value={attention}
        sublabel="Precisam de atenção"
        icon={<TriangleAlert size={19} />}
        tone="warning"
        active={activeStatus === "atencao"}
        onClick={() => onSelectStatus("atencao")}
      />
    </div>
  );
}
