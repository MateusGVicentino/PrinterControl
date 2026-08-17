/**
 * Dependências externas: react (useState) e lucide-react (ícones do form).
 * Login puramente client-side contra data/accounts.ts (ver o aviso lá) —
 * não bate em nenhum backend. `onSuccess` é a única saída deste componente;
 * quem decide o que fazer com a conta autenticada é App.tsx.
 */
import { useState, type FormEvent } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  TriangleAlert,
  ShieldCheck,
  Activity,
  BellRing,
  Wifi,
  Printer as PrinterIcon,
} from "lucide-react";
import { ACCOUNTS, type Account } from "../data/accounts";
import { useToast } from "../lib/toast";
import ElginLogo from "./ElginLogo";

interface LoginProps {
  onSuccess: (account: Account, remember: boolean) => void;
}

const features = [
  {
    icon: Activity,
    title: "Monitoramento em tempo real",
    text: "Acompanhe o status de toda a sua frota de impressoras em um só lugar.",
  },
  {
    icon: BellRing,
    title: "Alertas inteligentes",
    text: "Seja avisado antes que o toner acabe ou uma impressora saia do ar.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso seguro",
    text: "Controle quem entra no painel e mantenha sua rede sob controle.",
  },
];

// Nós fixos do "mapa de rede" decorativo do painel esquerdo — coordenadas em
// percentual (viewBox 0-100), pensadas pra parecerem uma malha de dispositivos
// monitorados, não um padrão repetido genérico.
const NETWORK_NODES = [
  { x: 12, y: 14 }, { x: 34, y: 8 }, { x: 58, y: 18 }, { x: 82, y: 10 },
  { x: 6, y: 38 }, { x: 28, y: 34 }, { x: 50, y: 42 }, { x: 74, y: 36 }, { x: 93, y: 44 },
  { x: 16, y: 60 }, { x: 40, y: 66 }, { x: 64, y: 58 }, { x: 88, y: 68 },
  { x: 10, y: 86 }, { x: 33, y: 90 }, { x: 56, y: 82 }, { x: 80, y: 92 },
];
const NETWORK_LINKS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [0, 4], [1, 5], [2, 6], [3, 7], [3, 8],
  [4, 5], [5, 6], [6, 7], [7, 8], [5, 9], [6, 10], [7, 11], [8, 12],
  [9, 10], [10, 11], [11, 12], [9, 13], [10, 14], [11, 15], [12, 16],
  [13, 14], [14, 15], [15, 16],
];
const ACTIVE_NODES = new Set([2, 6, 10, 15]);

function NetworkMap() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {NETWORK_LINKS.map(([a, b], i) => (
        <line
          key={i}
          x1={NETWORK_NODES[a].x}
          y1={NETWORK_NODES[a].y}
          x2={NETWORK_NODES[b].x}
          y2={NETWORK_NODES[b].y}
          stroke="white"
          strokeWidth="0.15"
        />
      ))}
      {NETWORK_NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={ACTIVE_NODES.has(i) ? 1.1 : 0.6} fill="white" />
      ))}
    </svg>
  );
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const { push } = useToast();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    window.setTimeout(() => {
      const account = ACCOUNTS.find((a) => a.email === email.trim().toLowerCase() && a.password === password);

      if (account) {
        onSuccess(account, remember);
        return;
      }

      setLoading(false);
      setError("E-mail ou senha incorretos. Verifique os dados e tente novamente.");
      setShake(true);
      window.setTimeout(() => setShake(false), 420);
    }, 650);
  }

  function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    push({
      variant: "info",
      title: "Fale com o administrador",
      description: "A redefinição de senha é feita pela equipe de TI da Elgin.",
    });
  }

  return (
    <div className="relative flex min-h-screen bg-canvas">
      {/* Left / branded hero panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#0a3a5c_0%,#0d4d78_46%,#0a6a9c_100%)] p-12 lg:flex xl:w-[42%]">
        <NetworkMap />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#4dc4f0]/20 blur-[110px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#0098e0]/25 blur-[100px]" />

        <div className="relative leading-tight">
          <ElginLogo height={38} tone="white" />
          <p className="mt-1 text-[11px] font-medium tracking-wide text-white/60">Impressoras</p>
        </div>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white/80 ring-1 ring-inset ring-white/15">
            <PrinterIcon size={12} />
            Painel corporativo
          </span>
          <h1 className="font-serif mt-5 max-w-md text-[2.3rem] font-semibold leading-[1.18] tracking-tight text-white text-balance">
            Gerencie sua frota de impressoras com clareza total.
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/70">
            Um painel único para status, toner, alertas e relatórios de toda a sua rede corporativa.
          </p>

          <div className="mt-10 flex flex-col gap-5">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-inset ring-white/15 backdrop-blur-sm">
                  <f.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="mt-0.5 text-sm text-white/60">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4 rounded-2xl bg-white/10 p-4 ring-1 ring-inset ring-white/15 backdrop-blur-md">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/20 text-[#7fe0ac]">
            <Wifi size={19} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">85 impressoras monitoradas</p>
            <p className="text-xs text-white/60">8 unidades · atualizado em tempo real</p>
          </div>
        </div>
      </div>

      {/* Right / form panel */}
      <div className="relative flex flex-1 flex-col items-center justify-center bg-surface px-6 py-12 sm:px-10 lg:shadow-[-24px_0_48px_-32px_rgba(38,33,28,0.12)]">
        <div className="mb-8 leading-tight lg:hidden">
          <ElginLogo height={32} />
          <p className="mt-0.5 text-[11px] font-medium text-ink-faint">Impressoras</p>
        </div>

        <div
          className={`w-full max-w-[400px] rounded-2xl border border-border bg-surface p-8 shadow-lg transition-transform ${
            shake ? "animate-[shake_0.42s_ease]" : ""
          }`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-tint text-brand-700">
            <ShieldCheck size={20} />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">Bem-vindo de volta</h2>
          <p className="mt-1.5 text-sm text-ink-faint">Entre com sua conta para acessar o painel de monitoramento.</p>

          <form className="mt-7 flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-ink-soft">
                E-mail
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-canvas px-3.5 py-3 transition-colors focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15">
                <Mail size={17} className="shrink-0 text-ink-faint" />
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.usuario"
                  className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="text-xs font-semibold text-ink-soft">
                  Senha
                </label>
                <button type="button" className="text-xs font-medium text-brand-700 hover:text-brand-600 hover:underline" onClick={handleForgotPassword}>
                  Esqueceu a senha?
                </button>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl border border-border bg-canvas px-3.5 py-3 transition-colors focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15">
                <Lock size={17} className="shrink-0 text-ink-faint" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full bg-transparent text-[15px] text-ink placeholder:text-ink-faint focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="shrink-0 text-ink-faint hover:text-ink"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-critical/25 bg-critical-tint px-3.5 py-3 text-sm text-critical">
                <TriangleAlert size={17} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="flex select-none items-center gap-2.5 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-[#0098e0]"
              />
              Lembrar de mim neste dispositivo
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-brand py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-ink-faint">© 2026 Elgin Impressoras · Painel de Monitoramento</p>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-5px); }
          40%, 60% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}
