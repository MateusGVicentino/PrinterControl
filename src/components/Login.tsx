"use client";

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
import { cn } from "../lib/cn";
import styles from "./Login.module.css";

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
      className={styles.networkMap}
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
    <div className={styles.page}>
      {/* Left / branded hero panel */}
      <div className={styles.heroPanel}>
        <NetworkMap />
        <div className={styles.blobTopRight} />
        <div className={styles.blobBottomLeft} />

        <div className={styles.heroLogo}>
          <ElginLogo height={38} tone="white" />
          <p className={styles.heroLogoSubtitle}>Impressoras</p>
        </div>

        <div className={styles.heroContent}>
          <span className={styles.badge}>
            <PrinterIcon size={12} />
            Painel corporativo
          </span>
          <h1 className={styles.heroTitle}>
            Gerencie sua frota de impressoras com clareza total.
          </h1>
          <p className={styles.heroSubtitle}>
            Um painel único para status, toner, alertas e relatórios de toda a sua rede corporativa.
          </p>

          <div className={styles.featureList}>
            {features.map((f) => (
              <div key={f.title} className={styles.featureItem}>
                <div className={styles.featureIconWrap}>
                  <f.icon size={18} />
                </div>
                <div>
                  <p className={styles.featureTitle}>{f.title}</p>
                  <p className={styles.featureText}>{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.statusCard}>
          <div className={styles.statusIconWrap}>
            <Wifi size={19} />
          </div>
          <div>
            <p className={styles.statusTitle}>85 impressoras monitoradas</p>
            <p className={styles.statusSubtitle}>8 unidades · atualizado em tempo real</p>
          </div>
        </div>
      </div>

      {/* Right / form panel */}
      <div className={styles.formPanel}>
        <div className={styles.mobileLogo}>
          <ElginLogo height={32} />
          <p className={styles.mobileLogoSubtitle}>Impressoras</p>
        </div>

        <div className={cn(styles.card, shake ? styles.shake : "")}>
          <div className={styles.cardIcon}>
            <ShieldCheck size={20} />
          </div>
          <h2 className={styles.cardTitle}>Bem-vindo de volta</h2>
          <p className={styles.cardSubtitle}>Entre com sua conta para acessar o painel de monitoramento.</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="login-email" className={styles.label}>
                E-mail
              </label>
              <div className={styles.inputWrap}>
                <Mail size={17} className={styles.inputIcon} />
                <input
                  id="login-email"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.usuario"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.field}>
              <div className={styles.labelRow}>
                <label htmlFor="login-password" className={styles.label}>
                  Senha
                </label>
                <button type="button" className={styles.forgotLink} onClick={handleForgotPassword}>
                  Esqueceu a senha?
                </button>
              </div>
              <div className={styles.inputWrap}>
                <Lock size={17} className={styles.inputIcon} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className={styles.input}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className={styles.togglePassword}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <TriangleAlert size={17} className={styles.errorIcon} />
                <span>{error}</span>
              </div>
            )}

            <label className={styles.rememberLabel}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className={styles.checkbox}
              />
              Lembrar de mim neste dispositivo
            </label>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
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

        <p className={styles.footer}>© 2026 Elgin Impressoras · Painel de Monitoramento</p>
      </div>
    </div>
  );
}
