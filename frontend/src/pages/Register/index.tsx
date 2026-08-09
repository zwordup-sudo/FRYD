import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import AuthShell from "../../components/auth/AuthShell";
import Modal from "../../components/ui/Modal";

const GoogleLogo = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#EA4335" d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.309 2.69 1.345 6.6l3.921 3.165z" />
    <path fill="#34A853" d="M16.04 15.345c-1.127.737-2.44 1.182-4.04 1.182a7.077 7.077 0 0 1-6.734-4.855L1.345 14.84C3.309 18.755 7.355 21.445 12 21.445c3.09 0 5.927-1.027 8.036-2.79l-4.036-3.31z" />
    <path fill="#4285F4" d="M23.49 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.473c-.29 1.482-1.136 2.727-2.409 3.564l4.036 3.31c2.364-2.182 3.727-5.382 3.727-9.02z" />
    <path fill="#FBBC05" d="M5.266 14.235A7.01 7.01 0 0 1 4.91 12c0-.79.136-1.555.355-2.235L1.345 6.6A11.968 11.968 0 0 0 0 12c0 1.927.455 3.755 1.255 5.4l4.01-3.165z" />
  </svg>
);

const EyeIcon = ({ hidden }: { hidden: boolean }) => (
  hidden ? (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 4.24A10.8 10.8 0 0 1 12 4c7 0 10 8 10 8a15 15 0 0 1-2.1 3.2" />
      <path d="M6.2 6.2C3.3 8.1 2 12 2 12s3 8 10 8a10.9 10.9 0 0 0 5.8-1.7" />
    </svg>
  ) : (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
);

const focusOptions = [
  {
    id: "personal",
    title: "Personal",
    eyebrow: "Vida y bienestar",
    description: "Hábitos, tareas diarias y diario reflexivo para construir un ritmo sostenible.",
    accent: "teal",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 21a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    id: "trabajo",
    title: "Trabajo",
    eyebrow: "Proyectos y equipo",
    description: "Organiza proyectos, tareas compartidas y progreso con una vista de trabajo conectada.",
    accent: "blue",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    ),
  },
  {
    id: "estudiante",
    title: "Estudiante",
    eyebrow: "Estudio y enfoque",
    description: "Centraliza entregas, proyectos académicos y hábitos de estudio sin perder contexto.",
    accent: "indigo",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    id: "empleado",
    title: "Empleado",
    eyebrow: "Objetivos y ejecución",
    description: "Da seguimiento a pendientes, objetivos y señales de productividad en tu jornada.",
    accent: "violet",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l2 2 4-4" />
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
];

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileFocus, setProfileFocus] = useState("personal");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleMockModal, setShowGoogleMockModal] = useState(false);

  const { register, loginGoogle } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  const strengthLabel = ["Añade una contraseña", "Básica", "Aceptable", "Buena", "Fuerte"][passwordStrength];
  const selectedFocus = focusOptions.find((option) => option.id === profileFocus) ?? focusOptions[0];

  const handleOAuthGoogleSuccess = async (tokenResponse: any) => {
    setError(null);
    setLoading(true);
    setShowGoogleMockModal(false);
    try {
      const userInfo = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      });
      const { email: googleEmail, name: googleName } = userInfo.data;
      await loginGoogle({
        id_token: tokenResponse.access_token,
        email: googleEmail,
        name: googleName,
      });
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError("Error al registrarse con tu cuenta real de Google.");
    } finally {
      setLoading(false);
    }
  };

  const triggerRealGoogleLogin = useGoogleLogin({
    onSuccess: handleOAuthGoogleSuccess,
    onError: () => setError("El registro real con Google falló."),
  });

  const handleNextStep = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setStep(2);
  };

  const handleGoogleLogin = async (googleEmail: string, googleName: string) => {
    setError(null);
    setLoading(true);
    setShowGoogleMockModal(false);
    try {
      await loginGoogle({
        id_token: `mock_google_token_${Date.now()}`,
        email: googleEmail,
        name: googleName,
      });
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError("Error al registrarse con Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ username, email, password, profile_focus: profileFocus });
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (typeof detail === "string") {
          setError(detail);
        } else if (Array.isArray(detail)) {
          setError(detail.map((item: any) => `${item.loc.join(".")}: ${item.msg}`).join(" | "));
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError(err.message || "Error de conexión con el servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Empieza con intención"
      title="Diseña un sistema que se adapte a ti."
      description="Crea tu espacio y dinos qué quieres priorizar. FRYD organizará la experiencia inicial alrededor de ese contexto."
      contentWidth={step === 2 ? "wide" : "default"}
    >
      <div className="auth-register-header">
        <div>
          <p className="fryd-section-label">Nuevo espacio</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--color-text-primary)]">
            {step === 1 ? "Crea tu cuenta" : "¿En qué quieres enfocarte?"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">
            {step === 1
              ? "Primero necesitamos lo esencial. El resto lo iremos construyendo contigo."
              : "Elige el contexto que mejor representa cómo quieres empezar a usar FRYD."}
          </p>
        </div>
        <span className="auth-step-count">Paso {step} de 2</span>
      </div>

      <div className="auth-step-track" aria-label={`Paso ${step} de 2`}>
        <span className="auth-step-segment is-complete" />
        <span className={`auth-step-segment ${step === 2 ? "is-complete" : ""}`} />
      </div>

      {error && (
        <div className="auth-error" role="alert">
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </span>
          <span className="text-xs leading-5">{error}</span>
        </div>
      )}

      {step === 1 ? (
        <>
          <form onSubmit={handleNextStep} className="mt-7 space-y-5">
            <div>
              <label htmlFor="register-username" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Nombre de usuario
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3" />
                    <path d="M5 21a7 7 0 0 1 14 0" />
                  </svg>
                </span>
                <input
                  id="register-username"
                  type="text"
                  autoComplete="username"
                  required
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="tu_usuario"
                  className="fryd-input auth-input-with-icon"
                />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Correo electrónico
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <input
                  id="register-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@ejemplo.com"
                  className="fryd-input auth-input-with-icon"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label htmlFor="register-password" className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                  Contraseña
                </label>
                <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{strengthLabel}</span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="10" width="14" height="10" rx="2" />
                    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="fryd-input auth-input-with-icon auth-input-with-action"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <EyeIcon hidden={showPassword} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
                {[1, 2, 3, 4].map((level) => (
                  <span key={level} className={`auth-password-bar ${passwordStrength >= level ? "is-active" : ""}`} />
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
                Confirmar contraseña
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  className="fryd-input auth-input-with-icon auth-input-with-action"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-text-primary)]"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <EyeIcon hidden={showConfirmPassword} />
                </button>
              </div>
              {confirmPassword && (
                <p className={`mt-2 flex items-center gap-1.5 text-[10px] font-medium ${password === confirmPassword ? "text-teal-300" : "text-amber-300"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${password === confirmPassword ? "bg-teal-400" : "bg-amber-400"}`} />
                  {password === confirmPassword ? "Las contraseñas coinciden" : "Todavía no coinciden"}
                </p>
              )}
            </div>

            <button type="submit" className="btn-primary mt-2 w-full rounded-xl py-3.5 text-sm font-semibold">
              Continuar
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>

          <div className="my-7 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">o crea tu espacio con</span>
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          </div>

          <button
            type="button"
            onClick={() => setShowGoogleMockModal(true)}
            disabled={loading}
            className="auth-google-button"
          >
            <GoogleLogo />
            Continuar con Google
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-7">
          <div className="auth-focus-grid">
            {focusOptions.map((option) => {
              const selected = profileFocus === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setProfileFocus(option.id)}
                  className={`auth-focus-card auth-focus-${option.accent} ${selected ? "is-selected" : ""}`}
                  aria-pressed={selected}
                >
                  <span className="auth-focus-icon">{option.icon}</span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{option.eyebrow}</span>
                    <span className="mt-1 block text-base font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">{option.title}</span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--color-text-secondary)]">{option.description}</span>
                  </span>
                  <span className={`auth-focus-check ${selected ? "is-visible" : ""}`} aria-hidden="true">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l4 4L19 6" />
                    </svg>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="auth-focus-summary">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gradient-soft)] text-indigo-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Tu punto de partida: {selectedFocus.title}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">FRYD usará este enfoque como contexto inicial para organizar tu experiencia.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-between">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary px-5 py-3 sm:min-w-[8rem]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
              Atrás
            </button>
            <button type="submit" disabled={loading} className="btn-primary px-6 py-3 disabled:pointer-events-none disabled:opacity-55 sm:min-w-[12rem]">
              {loading ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  Creando espacio...
                </>
              ) : (
                <>
                  Crear mi espacio
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
        ¿Ya tienes una cuenta?{" "}
        <Link to="/login" className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200">
          Inicia sesión
        </Link>
      </p>

      <Modal
        open={showGoogleMockModal}
        onClose={() => setShowGoogleMockModal(false)}
        title="Crear cuenta con Google"
        description="Usa tu cuenta real o una identidad de simulación para el entorno de pruebas."
        icon={<GoogleLogo className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <button type="button" onClick={() => triggerRealGoogleLogin()} className="auth-google-real">
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-slate-900">
              <GoogleLogo className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">Abrir Google</span>
              <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-muted)]">Autenticación real mediante el popup oficial de Google.</span>
            </span>
            <svg className="flex-shrink-0 text-[var(--color-text-muted)]" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">Cuentas de simulación</span>
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          </div>

          <div className="space-y-2.5">
            {[
              { name: "Admin Tester", email: "admin_tester@fryd.com", desc: "Admin local" },
              { name: "Juan Pérez", email: "juan.perez@gmail.com", desc: "Personal" },
              { name: "Sofía Rodríguez", email: "sofia.rod@outlook.com", desc: "Profesional" },
            ].map((account) => (
              <button type="button" key={account.email} onClick={() => handleGoogleLogin(account.email, account.name)} className="auth-account-row group">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-gradient-soft)] text-xs font-semibold text-indigo-200">
                  {account.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium text-[var(--color-text-primary)]">{account.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--color-text-muted)]">{account.email}</span>
                </span>
                <span className="rounded-lg border border-[var(--color-border-subtle)] bg-white/[0.025] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)] transition-colors group-hover:text-indigo-300">
                  {account.desc}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--color-text-muted)]">Otra cuenta simulada</span>
            <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const formData = new FormData(event.currentTarget);
              const emailValue = formData.get("custom_email") as string;
              if (emailValue) handleGoogleLogin(emailValue, emailValue.split("@")[0]);
            }}
            className="flex flex-col gap-2.5 sm:flex-row"
          >
            <input name="custom_email" type="email" required placeholder="correo@ejemplo.com" className="fryd-input min-w-0 flex-1" />
            <button type="submit" className="btn-secondary whitespace-nowrap px-5">Acceder</button>
          </form>
        </div>
      </Modal>
    </AuthShell>
  );
};

export default Register;
