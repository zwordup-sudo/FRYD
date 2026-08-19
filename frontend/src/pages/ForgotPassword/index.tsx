import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../../components/auth/AuthShell";
import api from "../../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Dev/Test helper token display
  const [devToken, setDevToken] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDevToken(null);
    setLoading(true);

    try {
      const response = await api.post("/users/forgot-password", { email });
      setSuccess("Se ha procesado tu solicitud de restablecimiento.");
      if (response.data.dev_reset_token) {
        setDevToken(response.data.dev_reset_token);
      }
      setStep(2);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Error al solicitar restablecimiento de contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await api.post("/users/reset-password", {
        email,
        token,
        new_password: newPassword,
      });
      setSuccess("Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión.");
      // Clear forms
      setToken("");
      setNewPassword("");
      setDevToken(null);
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Error al restablecer la contraseña. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell variant="login-concept-2">
      <div className="auth-c2-login-header">
        <div className="auth-c2-status-pill">
          <span className="auth-c2-status-shield" aria-hidden="true">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <span>Recuperación de cuenta</span>
          <span className="auth-c2-status-dot" aria-hidden="true" />
        </div>
        <h2>Restablecer contraseña</h2>
        <p>
          {step === 1
            ? "Ingresa tu correo electrónico para enviarte un código de recuperación temporal de un solo uso."
            : "Ingresa el código de 6 dígitos que te enviamos y define tu nueva contraseña de ingreso."}
        </p>
      </div>

      {error && (
        <div className="auth-error-alert" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span className="text-xs font-semibold leading-5">{error}</span>
        </div>
      )}

      {success && (
        <div className="auth-c2-status-pill bg-green-500/10 border border-green-500/20 text-green-300 py-2.5 px-4 rounded-xl flex items-start gap-2.5 mb-5" role="alert">
          <svg className="mt-0.5 flex-shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span className="text-xs leading-5">{success}</span>
        </div>
      )}

      {/* Dev helper simulated inbox card */}
      {devToken && (
        <div className="mt-2 mb-6 rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-bold text-indigo-200">Simulador de Correo (Dev Mode)</p>
              <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
                Código temporal de recuperación enviado a <span className="font-semibold text-white">{email}</span>:
              </p>
              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1 text-sm font-mono font-bold tracking-wider text-indigo-300">
                {devToken}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 1 ? (
        <form onSubmit={handleRequestToken} className="auth-c2-login-form">
          <div>
            <label htmlFor="recovery-email" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
              Correo electrónico
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </span>
              <input
                id="recovery-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="fryd-input w-full pl-10 pr-4 py-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-c2-primary-button disabled:pointer-events-none disabled:opacity-55"
          >
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Solicitando...
              </>
            ) : (
              <>
                Enviar código de recuperación
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="auth-c2-login-form">
          <div>
            <label htmlFor="recovery-code" className="mb-2 block text-xs font-semibold text-[var(--color-text-secondary)]">
              Código de recuperación (6 dígitos)
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
              <input
                id="recovery-code"
                type="text"
                required
                maxLength={6}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="fryd-input w-full pl-10 pr-4 py-3 text-center font-mono font-bold tracking-widest text-lg"
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="new-password" className="block text-xs font-semibold text-[var(--color-text-secondary)]">
                Nueva contraseña
              </label>
              <span className="auth-c2-private-label">Min. 6 caracteres</span>
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              </span>
              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nueva contraseña"
                className="fryd-input w-full pl-10 pr-10 py-3"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary auth-c2-primary-button disabled:pointer-events-none disabled:opacity-55"
          >
            {loading ? (
              <>
                <span className="auth-spinner" aria-hidden="true" />
                Restableciendo...
              </>
            ) : (
              <>
                Confirmar nueva contraseña
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m5 12 5 5L20 7" />
                </svg>
              </>
            )}
          </button>
        </form>
      )}

      <p className="auth-c2-signup-link mt-5">
        <Link to="/login" className="font-semibold text-indigo-300 transition-colors hover:text-indigo-200 inline-flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver al inicio de sesión
        </Link>
      </p>
    </AuthShell>
  );
}
