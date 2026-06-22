import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

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
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const focusOptions = [
    {
      id: "personal",
      title: "Personal",
      description: "Hábitos, tareas diarias y diario reflexivo para tu crecimiento.",
      icon: (
        <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "trabajo",
      title: "Trabajo",
      description: "Proyectos colaborativos, tableros Kanban y analíticas avanzadas.",
      icon: (
        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      id: "estudiante",
      title: "Estudiante",
      description: "Organización de tareas, proyectos académicos y hábitos de estudio.",
      icon: (
        <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      id: "empleado",
      title: "Empleado",
      description: "Seguimiento de tareas, objetivos y reportes de productividad laboral.",
      icon: (
        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--color-surface-base)] relative overflow-hidden font-sans">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent-primary)]/10 blur-[120px] pointer-events-none animate-float" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-accent-secondary)]/10 blur-[120px] pointer-events-none animate-float" style={{ animationDelay: "1s" }} />

      {/* Register Box */}
      <div className="w-full max-w-lg p-8 mx-4 rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/80 backdrop-blur-xl shadow-2xl relative z-10 animate-fade-in transition-all duration-300">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] p-0.5 shadow-lg shadow-emerald-500/15 mb-3">
            <div className="w-full h-full bg-[var(--color-surface-elevated)] rounded-[10px] flex items-center justify-center">
              <span className="text-xl font-bold bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] bg-clip-text text-transparent">F</span>
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
            {step === 1 ? "Regístrate" : "Personaliza tu Enfoque"}
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1">
            {step === 1 
              ? "Comienza tu viaje de crecimiento personal" 
              : "Selecciona el uso principal que le darás a FRYD"}
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center items-center gap-2 mb-6">
          <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-8 bg-[var(--color-accent-primary)]" : "w-2 bg-[var(--color-border-default)]"}`} />
          <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-8 bg-[var(--color-accent-primary)]" : "w-2 bg-[var(--color-border-default)]"}`} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3 rounded-lg border border-[var(--color-accent-danger)]/20 bg-[var(--color-accent-danger)]/10 text-[var(--color-accent-danger)] text-xs text-center animate-shake">
            {error}
          </div>
        )}

        {/* Step 1: Account credentials */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Nombre de Usuario
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="tu_usuario"
                className="fryd-input"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
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
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
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

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1.5">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="fryd-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
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
              className="w-full btn-primary py-3.5 mt-4 rounded-xl text-[var(--color-text-inverse)] font-semibold transition-all text-sm cursor-pointer text-center block"
            >
              Siguiente
            </button>
          </form>
        )}

        {/* Step 2: Onboarding focus */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {focusOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => setProfileFocus(opt.id)}
                  className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all duration-300 flex flex-col h-full hover:scale-[1.02] ${
                    profileFocus === opt.id
                      ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10 shadow-lg shadow-emerald-500/5"
                      : "border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]/40 hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-1.5 rounded-lg ${profileFocus === opt.id ? "bg-[var(--color-accent-primary)]/20" : "bg-[var(--color-surface-card)]"}`}>
                      {opt.icon}
                    </div>
                    <span className="font-bold text-sm text-[var(--color-text-primary)]">{opt.title}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed flex-grow">
                    {opt.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3.5 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-elevated)]/30 text-[var(--color-text-primary)] font-semibold transition-all hover:bg-[var(--color-surface-elevated)]/60 text-sm cursor-pointer text-center"
              >
                Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 btn-primary py-3.5 rounded-xl text-[var(--color-text-inverse)] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none text-sm cursor-pointer text-center"
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-[var(--color-text-secondary)]">
          ¿Ya tienes una cuenta?{" "}
          <Link to="/login" className="text-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary-hover)] font-semibold transition-colors">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
