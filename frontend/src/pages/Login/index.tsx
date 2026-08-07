import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";

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
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
      });
      const { email: googleEmail, name: googleName } = userInfo.data;
      await loginGoogle({
        id_token: tokenResponse.access_token,
        email: googleEmail,
        name: googleName
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
    onError: () => {
      setError("El inicio de sesión real con Google falló.");
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setError(detail.map((d: any) => `${d.loc.join(".")}: ${d.msg}`).join(" | "));
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
        name: googleName
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-surface-base)] relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent-primary)]/10 blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent-secondary)]/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: "1s" }} />

      {/* Login Box */}
      <div className="w-full max-w-md p-8 mx-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/80 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-in">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-tr from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] p-0.5 shadow-lg shadow-emerald-500/15 mb-4">
            <div className="w-full h-full bg-[var(--color-surface-elevated)] rounded-[10px] flex items-center justify-center">
              <span className="text-2xl font-bold bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">F</span>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] tracking-tight">FRYD</h2>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1.5">Organiza, mejora y alcanza tus objetivos</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg border border-[var(--color-accent-danger)]/20 bg-[var(--color-accent-danger)]/10 text-[var(--color-accent-danger)] text-xs text-center animate-shake">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@ejemplo.com"
              className="fryd-input"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="fryd-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            className="w-full btn-primary py-3.5 mt-4 rounded-xl text-[var(--color-text-inverse)] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-border-default)]"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[var(--color-surface-card)] px-3 text-[var(--color-text-muted)] font-bold tracking-wider">O continuar con</span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => setShowGoogleMockModal(true)}
          className="w-full py-3.5 px-4 border border-[var(--color-border-default)] bg-white/[0.01] hover:bg-white/[0.04] rounded-xl text-sm font-semibold text-[var(--color-text-primary)] transition-all flex items-center justify-center gap-3 cursor-pointer mb-6"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.355 0 3.309 2.69 1.345 6.6l3.921 3.165z"
            />
            <path
              fill="#34A853"
              d="M16.04 15.345c-1.127.737-2.44 1.182-4.04 1.182a7.077 7.077 0 0 1-6.734-4.855L1.345 14.84C3.309 18.755 7.355 21.445 12 21.445c3.09 0 5.927-1.027 8.036-2.79l-4.036-3.31z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.273c0-.818-.082-1.609-.218-2.364H12v4.51h6.473c-.29 1.482-1.136 2.727-2.409 3.564l4.036 3.31c2.364-2.182 3.727-5.382 3.727-9.02z"
            />
            <path
              fill="#FBBC05"
              d="M5.266 14.235A7.01 7.01 0 0 1 4.91 12c0-.79.136-1.555.355-2.235L1.345 6.6A11.968 11.968 0 0 0 0 12c0 1.927.455 3.755 1.255 5.4l4.01-3.165z"
            />
          </svg>
          Google
        </button>

        {/* Footer Link */}
        <div className="mt-8 text-center text-xs text-[var(--color-text-secondary)]">
          ¿No tienes una cuenta?{" "}
          <Link to="/register" className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-hover)] font-semibold transition-colors">
            Regístrate ahora
          </Link>
        </div>
      </div>

      {/* Mock Google Login Modal */}
      {showGoogleMockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0d0f12] border border-white/[0.08] rounded-[24px] p-8 space-y-6 shadow-2xl animate-fade-in relative">
            <button
              onClick={() => setShowGoogleMockModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <svg className="w-10 h-10" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Cuentas de Google</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1.5">Elige una cuenta para continuar en FRYD</p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Real OAuth Google Trigger Button */}
              <button
                type="button"
                onClick={() => triggerRealGoogleLogin()}
                className="w-full p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 text-left transition-all cursor-pointer flex items-center justify-between group gap-4"
              >
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                    🔑 Iniciar con Google Real
                  </span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    Usa tu cuenta real a través del pop-up oficial de Google
                  </span>
                </div>
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/[0.05]"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                  <span className="bg-[#0d0f12] px-3 text-slate-500">O usa cuentas de simulación</span>
                </div>
              </div>

              {[
                { name: "Admin Tester", email: "admin_tester@fryd.com", desc: "Admin local" },
                { name: "Juan Pérez", email: "juan.perez@gmail.com", desc: "Personal" },
                { name: "Sofía Rodríguez", email: "sofia.rod@outlook.com", desc: "Profesional" }
              ].map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleLogin(acc.email, acc.name)}
                  className="w-full p-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.05] hover:border-emerald-500/30 text-left transition-all cursor-pointer flex items-center justify-between group gap-4"
                >
                  <div className="min-w-0">
                    <span className="block text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{acc.name}</span>
                    <span className="block text-xs text-slate-400 mt-0.5 truncate">{acc.email}</span>
                  </div>
                  <span className="text-[9px] font-bold bg-white/[0.04] text-slate-400 group-hover:bg-emerald-500/15 group-hover:text-emerald-400 px-2.5 py-1 rounded-lg border border-white/[0.05] group-hover:border-emerald-500/25 transition-all whitespace-nowrap">
                    {acc.desc}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.05]"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                <span className="bg-[#0d0f12] px-3 text-slate-500">O usa otra cuenta</span>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const emailVal = fd.get("custom_email") as string;
                if (emailVal) {
                  handleGoogleLogin(emailVal, emailVal.split("@")[0]);
                }
              }}
              className="flex gap-3 pt-1"
            >
              <input
                name="custom_email"
                type="email"
                required
                placeholder="correo@ejemplo.com"
                className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] rounded-2xl text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
              >
                Acceder
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
