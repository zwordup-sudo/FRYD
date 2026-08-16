import React, { useState } from "react";
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

const EyeIcon = ({ hidden }: { hidden: boolean }) => hidden ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleMockModal, setShowGoogleMockModal] = useState(false);

  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();

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
      setError("Error al autenticar con tu cuenta real de Google.");
    } finally {
      setLoading(false);
    }
  };

  const triggerRealGoogleLogin = useGoogleLogin({
    onSuccess: handleOAuthGoogleSuccess,
    onError: () => setError("El inicio de sesión real con Google falló."),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
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
      setError("Error al iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-default)] bg-white/[0.025] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-success)]" />
          Tu espacio está listo
        </div>
        <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-white sm:text-[2.25rem]">
          Bienvenido de vuelta.
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--color-text-secondary)]">
          Entra a FRYD y continúa exactamente donde dejaste tus tareas, hábitos, proyectos e ideas.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--color-accent-danger)]/20 bg-[var(--color-accent-danger)]/[0.08] px-4 py-3 text-sm text-red-300 animate-fade-in" role="alert">
          <svg className="mt-0.5 flex-shrink-0" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <span className="leading-5">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="login-email" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
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
              id="login-email"
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
            <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--color-text-secondary)]">
              Contraseña
            </label>
            <span className="text-[10px] font-medium text-[var(--color-text-muted)]">Protegida y privada</span>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-2 w-full rounded-xl py-3.5 text-sm font-semibold disabled:pointer-events-none disabled:opacity-55"
        >
          {loading ? (
            <>
              <span className="auth-spinner" aria-hidden="true" />
              Entrando a FRYD...
            </>
          ) : (
            <>
              Entrar a FRYD
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="my-7 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">o continúa con</span>
        <span className="h-px flex-1 bg-[var(--color-border-subtle)]" />
      </div>

      <button
        type="button"
        onClick={() => {
          const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
          const isCapacitor = window.hasOwnProperty("Capacitor") || 
                              window.location.protocol.startsWith("capacitor") || 
                              window.location.protocol === "file:";
          if (isLocalhost && !isCapacitor) {
            setShowGoogleMockModal(true);
          } else {
            triggerRealGoogleLogin();
          }
        }}
        disabled={loading}
        className="auth-google-button"
      >
        <GoogleLogo />
        Continuar con Google
      </button>

      <div className="mt-7 rounded-xl border border-[var(--color-border-subtle)] bg-white/[0.018] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <p className="text-xs leading-5 text-[var(--color-text-muted)]">
            Tu sesión permanece guardada en este dispositivo para que puedas volver a tu espacio sin fricción.
          </p>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--color-text-secondary)]">
        ¿Todavía no tienes cuenta?{" "}
        <Link to="/register" className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200">
          Crea tu espacio
        </Link>
      </p>

      <Modal
        open={showGoogleMockModal}
        onClose={() => setShowGoogleMockModal(false)}
        title="Continuar con Google"
        description="Usa tu cuenta real o una identidad de simulación para el entorno de pruebas."
        icon={<GoogleLogo className="h-5 w-5" />}
      >
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => triggerRealGoogleLogin()}
            className="auth-google-real"
          >
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
              <button
                type="button"
                key={account.email}
                onClick={() => handleGoogleLogin(account.email, account.name)}
                className="auth-account-row group"
              >
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
            <input
              name="custom_email"
              type="email"
              required
              placeholder="correo@ejemplo.com"
              className="fryd-input min-w-0 flex-1"
            />
            <button type="submit" className="btn-secondary whitespace-nowrap px-5">
              Acceder
            </button>
          </form>
        </div>
      </Modal>
    </AuthShell>
  );
};

export default Login;
