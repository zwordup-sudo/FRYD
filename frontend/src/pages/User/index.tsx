import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getTasks, getHabits, getDiaryEntries, updateUserSettings } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import StatTile from "../../components/ui/StatTile";
import Modal from "../../components/ui/Modal";

const GRADIENTS = [
  { id: "fryd", label: "FRYD", value: "linear-gradient(135deg, #6366f1 0%, #3b82f6 52%, #14b8a6 100%)" },
  { id: "indigo-violet", label: "Índigo & Violeta", value: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  { id: "purple-rose", label: "Rosa & Morado", value: "linear-gradient(135deg, #a855f7 0%, #f472b6 100%)" },
  { id: "emerald-teal", label: "Esmeralda & Menta", value: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" },
  { id: "sky-blue", label: "Celeste & Azul", value: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)" },
];

const translations = {
  es: {
    eyebrow: "TU ESPACIO",
    profile: "Perfil y ajustes",
    manage: "Configura cómo se ve FRYD, cómo trabaja contigo y qué integraciones están activas.",
    active: "Cuenta activa",
    statsTitle: "Tu actividad",
    completed: "Completadas",
    pending: "Pendientes",
    activeHabits: "Hábitos activos",
    diaryEntries: "Entradas de diario",
    completionRate: "Tasa de completado",
    accountTitle: "Cuenta",
    accountDesc: "Tu identidad dentro de FRYD.",
    username: "Nombre de usuario",
    email: "Correo electrónico",
    edit: "Editar",
    save: "Guardar",
    cancel: "Cancelar",
    preferencesTitle: "Experiencia",
    preferencesDesc: "Ajusta la apariencia, idioma y asistente predeterminado.",
    darkTheme: "Apariencia",
    dark: "Oscuro",
    light: "Claro",
    langLabel: "Idioma",
    aiLabel: "Asistente IA",
    focusLabel: "Enfoque de cuenta",
    focusDesc: "FRYD usa este enfoque para priorizar herramientas y contexto.",
    personal: "Personal",
    personalDesc: "Organización, bienestar y objetivos personales.",
    trabajo: "Trabajo",
    trabajoDesc: "Proyectos, entregables y productividad profesional.",
    estudiante: "Estudiante",
    estudianteDesc: "Estudio, hábitos académicos y seguimiento de pendientes.",
    empleado: "Empleado",
    empleadoDesc: "Rutina laboral, colaboración y progreso diario.",
    identityTitle: "Identidad visual",
    identityDesc: "Elige el acento de tu avatar sin alterar la identidad general de FRYD.",
    whatsappTitle: "WhatsApp",
    whatsappDesc: "Recordatorios y captura rápida de tareas.",
    whatsappConnected: "Configurado",
    whatsappInactive: "Sin configurar",
    configure: "Configurar",
    integrationDesc: "Conecta el Sandbox de Twilio para recibir recordatorios y conversar con FRYD desde WhatsApp.",
    whatsappSteps: "Antes de guardar",
    step1: "Copia tu código Sandbox de Twilio (por ejemplo: join simple-giant).",
    step2: "Escanea el QR o abre el enlace para enviar el mensaje de unión.",
    step3: "Añade tu número con código de país y activa los recordatorios.",
    qrLabel: "Escanea para conectar",
    qrError: "Ingresa un código Sandbox válido para generar el QR.",
    sandboxCode: "Código Sandbox",
    phone: "Número de WhatsApp",
    reminders: "Recordatorios activos",
    remindersDesc: "Permite que FRYD envíe alertas de tareas por WhatsApp.",
    saveConfig: "Guardar integración",
    savedOk: "Configuración guardada",
    logout: "Cerrar sesión",
    aboutTitle: "FRYD",
    aboutDesc: "Tu workspace personal para organizar, conectar y avanzar.",
    version: "Versión",
    stack: "Stack",
    philosophy: "Principio",
    changeAvatarColor: "Color de perfil",
    overviewTitle: "Estado de tu espacio",
    overviewDesc: "Una lectura rápida de cómo estás usando FRYD.",
    taskHealth: "Ejecución de tareas",
    habitHealth: "Hábitos activos",
    journalHealth: "Reflexiones guardadas",
    accountFocus: "Enfoque",
    openWhatsapp: "Abrir WhatsApp",
  },
  en: {
    eyebrow: "YOUR SPACE",
    profile: "Profile & settings",
    manage: "Configure how FRYD looks, works with you, and which integrations are active.",
    active: "Active account",
    statsTitle: "Your activity",
    completed: "Completed",
    pending: "Pending",
    activeHabits: "Active habits",
    diaryEntries: "Diary entries",
    completionRate: "Completion rate",
    accountTitle: "Account",
    accountDesc: "Your identity inside FRYD.",
    username: "Username",
    email: "Email address",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    preferencesTitle: "Experience",
    preferencesDesc: "Adjust appearance, language and default assistant.",
    darkTheme: "Appearance",
    dark: "Dark",
    light: "Light",
    langLabel: "Language",
    aiLabel: "AI assistant",
    focusLabel: "Account focus",
    focusDesc: "FRYD uses this focus to prioritize tools and context.",
    personal: "Personal",
    personalDesc: "Organization, wellbeing and personal goals.",
    trabajo: "Work",
    trabajoDesc: "Projects, deliverables and professional productivity.",
    estudiante: "Student",
    estudianteDesc: "Study, academic habits and pending work.",
    empleado: "Employee",
    empleadoDesc: "Work routine, collaboration and daily progress.",
    identityTitle: "Visual identity",
    identityDesc: "Choose your avatar accent without changing FRYD's core identity.",
    whatsappTitle: "WhatsApp",
    whatsappDesc: "Reminders and fast task capture.",
    whatsappConnected: "Configured",
    whatsappInactive: "Not configured",
    configure: "Configure",
    integrationDesc: "Connect the Twilio Sandbox to receive reminders and chat with FRYD from WhatsApp.",
    whatsappSteps: "Before saving",
    step1: "Copy your Twilio Sandbox code (for example: join simple-giant).",
    step2: "Scan the QR or open the link to send the join message.",
    step3: "Add your number with country code and enable reminders.",
    qrLabel: "Scan to connect",
    qrError: "Enter a valid Sandbox code to generate the QR.",
    sandboxCode: "Sandbox code",
    phone: "WhatsApp number",
    reminders: "Active reminders",
    remindersDesc: "Allow FRYD to send task alerts through WhatsApp.",
    saveConfig: "Save integration",
    savedOk: "Settings saved",
    logout: "Log out",
    aboutTitle: "FRYD",
    aboutDesc: "Your personal workspace to organize, connect and move forward.",
    version: "Version",
    stack: "Stack",
    philosophy: "Principle",
    changeAvatarColor: "Profile color",
    overviewTitle: "Workspace status",
    overviewDesc: "A quick read of how you're using FRYD.",
    taskHealth: "Task execution",
    habitHealth: "Active habits",
    journalHealth: "Saved reflections",
    accountFocus: "Focus",
    openWhatsapp: "Open WhatsApp",
  },
};

type SettingCardProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
};

function SettingCard({ title, description, icon, children }: SettingCardProps) {
  return (
    <section className="card-static p-0 overflow-hidden">
      <header className="flex items-start gap-3.5 px-5 py-4 border-b border-[var(--color-border-subtle)]">
        <div className="w-9 h-9 rounded-xl brand-gradient-soft border border-[var(--color-border-accent)] flex items-center justify-center text-[var(--color-accent-primary)] flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h2>
          {description && <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">{description}</p>}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

function RowDivider() {
  return <div className="h-px bg-[var(--color-border-subtle)]" />;
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function UserPage() {
  const { user, logout, updateUser, language, changeLanguage } = useAuth();

  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeHabits: 0,
    totalHabits: 0,
    diaryEntries: 0,
  });

  const [phoneNumber, setPhoneNumber] = useState(() => localStorage.getItem("fryd_whatsapp_phone") || "");
  const [whatsappActive, setWhatsappActive] = useState(() => localStorage.getItem("fryd_whatsapp_active") === "true");
  const [sandboxCode, setSandboxCode] = useState(() => localStorage.getItem("fryd_whatsapp_sandbox") || "");
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const [avatarGradient, setAvatarGradient] = useState(() =>
    localStorage.getItem("fryd_avatar_gradient") || "linear-gradient(135deg, #6366f1 0%, #3b82f6 52%, #14b8a6 100%)"
  );

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [darkTheme, setDarkTheme] = useState(() => localStorage.getItem("fryd_theme") !== "light");
  const [aiProvider, setAiProvider] = useState("ollama");
  const [profileFocus, setProfileFocus] = useState("personal");

  const t = language === "en" ? translations.en : translations.es;

  useEffect(() => {
    if (!user) return;
    setPhoneNumber(user.whatsapp_phone || "");
    setWhatsappActive(!!user.whatsapp_active);
    setSandboxCode(user.whatsapp_sandbox || "");
    setUsernameInput(user.username || "");
    setAiProvider(user.ai_provider || "ollama");
    setProfileFocus(user.profile_focus || "personal");
  }, [user]);

  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("fryd_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("fryd_theme", "light");
    }
  }, [darkTheme]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [tasks, habits, entries] = await Promise.all([getTasks(), getHabits(), getDiaryEntries()]);
        setStats({
          totalTasks: tasks.length,
          completedTasks: tasks.filter((task: { status: string }) => task.status === "completed").length,
          activeHabits: habits.filter((habit: { status: string }) => habit.status === "active").length,
          totalHabits: habits.length,
          diaryEntries: entries.length,
        });
      } catch {
        // Keep the profile useful even when one metric endpoint is unavailable.
      }
    };
    loadStats();
  }, []);

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  const pendingTasks = Math.max(stats.totalTasks - stats.completedTasks, 0);
  const isValidSandbox = sandboxCode.trim().toLowerCase().startsWith("join ");
  const whatsappConfigured = Boolean(phoneNumber || sandboxCode || whatsappActive);

  const focusOptions = useMemo(
    () => [
      { id: "personal", label: t.personal, description: t.personalDesc, glyph: "⌂" },
      { id: "trabajo", label: t.trabajo, description: t.trabajoDesc, glyph: "▦" },
      { id: "estudiante", label: t.estudiante, description: t.estudianteDesc, glyph: "◇" },
      { id: "empleado", label: t.empleado, description: t.empleadoDesc, glyph: "◎" },
    ],
    [t]
  );

  const activeFocus = focusOptions.find((option) => option.id === profileFocus) || focusOptions[0];
  const initials = (user?.username || user?.email || "FR")
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "FR";

  const handleAIProviderChange = async (provider: string) => {
    setAiProvider(provider);
    try {
      await updateUserSettings({ ai_provider: provider });
      updateUser?.({ ai_provider: provider });
    } catch (err) {
      console.error("Error saving AI provider preference:", err);
    }
  };

  const handleProfileFocusChange = async (focusVal: string) => {
    setProfileFocus(focusVal);
    try {
      await updateUserSettings({ profile_focus: focusVal });
      updateUser?.({ profile_focus: focusVal });
    } catch (err) {
      console.error("Error saving profile focus preference:", err);
    }
  };

  const handleGradientChange = (value: string) => {
    setAvatarGradient(value);
    localStorage.setItem("fryd_avatar_gradient", value);
    document.documentElement.style.setProperty("--profile-gradient", value);
  };

  const handleSaveUsername = async () => {
    setUsernameError("");
    setUsernameSuccess(false);
    const cleanUsername = usernameInput.trim();

    if (!cleanUsername) {
      setUsernameError(language === "en" ? "Username cannot be empty." : "El nombre de usuario no puede estar vacío.");
      return;
    }

    try {
      await updateUserSettings({ username: cleanUsername });
      updateUser?.({ username: cleanUsername });
      setUsernameSuccess(true);
      setIsEditingUsername(false);
      window.setTimeout(() => setUsernameSuccess(false), 2200);
    } catch (err: any) {
      const message = err.response?.data?.detail || (language === "en" ? "Error updating username." : "Error al actualizar el nombre de usuario.");
      setUsernameError(message);
    }
  };

  const handleSaveWhatsapp = async () => {
    try {
      localStorage.setItem("fryd_whatsapp_phone", phoneNumber);
      localStorage.setItem("fryd_whatsapp_active", whatsappActive ? "true" : "false");
      localStorage.setItem("fryd_whatsapp_sandbox", sandboxCode);

      await updateUserSettings({
        whatsapp_phone: phoneNumber,
        whatsapp_active: whatsappActive,
        whatsapp_sandbox: sandboxCode,
      });

      updateUser?.({
        whatsapp_phone: phoneNumber,
        whatsapp_active: whatsappActive,
        whatsapp_sandbox: sandboxCode,
      });

      setSavedMessage(true);
      window.setTimeout(() => {
        setSavedMessage(false);
        setWhatsappModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error("Error saving WhatsApp settings to backend:", err);
    }
  };

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <PageHeader eyebrow={t.eyebrow} title={t.profile} description={t.manage} />

      <section className="relative overflow-hidden rounded-[1.4rem] border border-[var(--color-border-default)] bg-[var(--color-surface-card)] mb-5">
        <div className="absolute inset-x-0 top-0 h-px brand-gradient" />
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full brand-gradient-soft blur-3xl opacity-70 pointer-events-none" />
        <div className="relative p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center gap-5">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div
              className="w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] rounded-2xl flex items-center justify-center text-white text-xl font-bold tracking-tight shadow-lg flex-shrink-0"
              style={{ background: avatarGradient }}
              aria-label={`${t.changeAvatarColor}: ${initials}`}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)] truncate">
                  {user?.username || "FRYD User"}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-[var(--color-accent-success)] bg-emerald-400/10 border border-emerald-400/15">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-success)]" />
                  {t.active}
                </span>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1 truncate">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-secondary)]">
                  <span className="text-[var(--color-accent-primary)]">{activeFocus.glyph}</span>
                  {activeFocus.label}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)]">
                  FRYD v1.0
                </span>
              </div>
            </div>
          </div>

          <div className="lg:w-[310px] rounded-2xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[var(--color-text-muted)]">{t.completionRate}</p>
                <p className="text-2xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)] mt-1">{completionRate}%</p>
              </div>
              <div className="w-11 h-11 rounded-xl brand-gradient-soft border border-[var(--color-border-accent)] text-[var(--color-accent-primary)] flex items-center justify-center">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />
                </svg>
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-[var(--color-surface-base)] overflow-hidden">
              <div className="h-full brand-gradient rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section className="mb-6">
        <p className="fryd-section-label mb-3">{t.statsTitle}</p>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-3 gap-y-6">
          <StatTile
            label={t.completed}
            value={stats.completedTasks}
            detail={stats.totalTasks ? `${completionRate}% ${language === "en" ? "of tasks" : "de tus tareas"}` : undefined}
            tone="success"
            icon={<CheckIcon />}
          />
          <StatTile
            label={t.pending}
            value={pendingTasks}
            detail={language === "en" ? "Open tasks" : "Tareas abiertas"}
            tone="warning"
            icon={<span className="text-base">○</span>}
          />
          <StatTile
            label={t.activeHabits}
            value={stats.activeHabits}
            detail={stats.totalHabits ? `${stats.activeHabits}/${stats.totalHabits} ${language === "en" ? "active" : "activos"}` : undefined}
            tone="brand"
            icon={<span className="text-base">◎</span>}
          />
          <StatTile
            label={t.diaryEntries}
            value={stats.diaryEntries}
            detail={language === "en" ? "Saved reflections" : "Reflexiones guardadas"}
            tone="muted"
            icon={<span className="text-base">◇</span>}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-x-5 gap-y-9 items-start">
        <div className="space-y-8">
          <SettingCard
            title={t.accountTitle}
            description={t.accountDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)]">{t.username}</label>
                  {!isEditingUsername ? (
                    <button
                      type="button"
                      onClick={() => {
                        setUsernameInput(user?.username || "");
                        setIsEditingUsername(true);
                        setUsernameError("");
                      }}
                      className="text-xs font-semibold text-[var(--color-accent-primary)] hover:text-[var(--color-accent-secondary)] transition-colors cursor-pointer"
                    >
                      {t.edit}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={handleSaveUsername} className="text-xs font-semibold text-[var(--color-accent-primary)] cursor-pointer">
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsernameError("");
                          setUsernameInput(user?.username || "");
                        }}
                        className="text-xs font-medium text-[var(--color-text-muted)] cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                  <input
                    type="text"
                    className={`fryd-input !pl-10 ${!isEditingUsername ? "opacity-75 cursor-not-allowed" : ""}`}
                    value={isEditingUsername ? usernameInput : user?.username || ""}
                    onChange={(event) => setUsernameInput(event.target.value)}
                    disabled={!isEditingUsername}
                  />
                </div>
                {usernameError && <p className="text-xs text-[var(--color-accent-danger)] mt-2 font-medium">{usernameError}</p>}
                {usernameSuccess && (
                  <p className="text-xs text-[var(--color-accent-success)] mt-2 font-medium flex items-center gap-1.5">
                    <CheckIcon size={13} />
                    {language === "en" ? "Username updated." : "Nombre de usuario actualizado."}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">{t.email}</label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
                  </svg>
                  <input type="email" className="fryd-input !pl-10 opacity-75 cursor-not-allowed" value={user?.email || ""} disabled />
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title={t.preferencesTitle}
            description={t.preferencesDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2v-4h.09A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 3.2l.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.09A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 8c.13.37.35.71.64.98.3.27.67.43 1.06.47H21v4h-.09a1.7 1.7 0 0 0-1.51 1.55Z" />
              </svg>
            }
          >
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.darkTheme}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{language === "en" ? "Choose the workspace surface." : "Elige la superficie general del workspace."}</p>
                </div>
                <div className="inline-flex p-1 rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setDarkTheme(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${darkTheme ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-muted)]"}`}
                  >
                    {t.dark}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDarkTheme(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${!darkTheme ? "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] shadow-sm" : "text-[var(--color-text-muted)]"}`}
                  >
                    {t.light}
                  </button>
                </div>
              </div>

              <RowDivider />

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">{t.langLabel}</label>
                  <select value={language} onChange={(event) => changeLanguage(event.target.value)} className="fryd-input cursor-pointer">
                    <option value="es">Español</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">{t.aiLabel}</label>
                  <select value={aiProvider} onChange={(event) => handleAIProviderChange(event.target.value)} className="fryd-input cursor-pointer">
                    <option value="ollama">Ollama</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Gemini</option>
                  </select>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title={t.focusLabel}
            description={t.focusDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
              </svg>
            }
          >
            <div className="grid sm:grid-cols-2 gap-3">
              {focusOptions.map((option) => {
                const selected = option.id === profileFocus;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleProfileFocusChange(option.id)}
                    className={`text-left rounded-2xl border p-4 transition-all cursor-pointer ${
                      selected
                        ? "border-[var(--color-border-accent)] brand-gradient-soft shadow-[0_10px_30px_rgba(99,102,241,0.08)]"
                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-input)] hover:border-[var(--color-border-default)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base ${selected ? "brand-gradient text-white" : "bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)]"}`}>
                        {option.glyph}
                      </div>
                      <span className={`w-5 h-5 rounded-full border flex items-center justify-center ${selected ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)] text-white" : "border-[var(--color-border-default)]"}`}>
                        {selected && <CheckIcon size={12} />}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-3">{option.label}</p>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">{option.description}</p>
                  </button>
                );
              })}
            </div>
          </SettingCard>

          <SettingCard
            title={t.whatsappTitle}
            description={t.integrationDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4.3a8.7 8.7 0 1 1 16.2-5.2Z" /><path d="M8.8 8.4c.5 2.5 2.3 4.3 4.8 4.8" />
              </svg>
            }
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${whatsappConfigured ? "bg-emerald-400/10 text-[var(--color-accent-success)] border border-emerald-400/15" : "bg-[var(--color-surface-input)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]"}`}>
                  {whatsappConfigured ? <CheckIcon /> : <span className="text-lg">＋</span>}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.whatsappDesc}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                    {whatsappConfigured ? t.whatsappConnected : t.whatsappInactive}
                    {phoneNumber ? ` · ${phoneNumber}` : ""}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setWhatsappModalOpen(true)} className="btn-secondary text-xs self-start sm:self-auto">
                {t.configure}
              </button>
            </div>
          </SettingCard>
        </div>

        <aside className="space-y-8 xl:sticky xl:top-6">
          <SettingCard
            title={t.identityTitle}
            description={t.identityDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" /><path d="M12 22a10 10 0 1 1 10-10c0 2.2-1.8 4-4 4h-1.8a2 2 0 0 0-1.7 3l.2.4A1.8 1.8 0 0 1 13.1 22H12Z" />
              </svg>
            }
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0" style={{ background: avatarGradient }}>
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">{t.changeAvatarColor}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {GRADIENTS.map((gradient) => (
                    <button
                      key={gradient.id}
                      type="button"
                      onClick={() => handleGradientChange(gradient.value)}
                      title={gradient.label}
                      aria-label={gradient.label}
                      style={{ background: gradient.value }}
                      className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${avatarGradient === gradient.value ? "ring-2 ring-[var(--color-text-primary)] ring-offset-2 ring-offset-[var(--color-surface-card)] scale-110" : "hover:scale-110"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title={t.overviewTitle}
            description={t.overviewDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" /><path d="m7 16 4-5 3 3 5-7" />
              </svg>
            }
          >
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-[var(--color-text-secondary)]">{t.taskHealth}</span>
                  <span className="font-semibold text-[var(--color-text-primary)]">{completionRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--color-surface-input)] overflow-hidden">
                  <div className="h-full brand-gradient rounded-full" style={{ width: `${completionRate}%` }} />
                </div>
              </div>
              <RowDivider />
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] p-3">
                  <p className="text-[11px] text-[var(--color-text-muted)]">{t.habitHealth}</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{stats.activeHabits}</p>
                </div>
                <div className="rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] p-3">
                  <p className="text-[11px] text-[var(--color-text-muted)]">{t.journalHealth}</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">{stats.diaryEntries}</p>
                </div>
              </div>
              <div className="rounded-xl brand-gradient-soft border border-[var(--color-border-accent)] p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[var(--color-text-muted)]">{t.accountFocus}</p>
                <p className="text-sm font-semibold text-[var(--color-text-primary)] mt-1">{activeFocus.label}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1 leading-relaxed">{activeFocus.description}</p>
              </div>
            </div>
          </SettingCard>

          <SettingCard
            title={t.aboutTitle}
            description={t.aboutDesc}
            icon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" />
              </svg>
            }
          >
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">{t.version}</span>
                <span className="font-semibold text-[var(--color-text-primary)]">1.0.0</span>
              </div>
              <RowDivider />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">{t.stack}</span>
                <span className="font-semibold text-[var(--color-text-primary)] text-right">React + FastAPI</span>
              </div>
              <RowDivider />
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--color-text-muted)]">{t.philosophy}</span>
                <span className="font-semibold brand-gradient-text">Organiza · Avanza · Logra</span>
              </div>
            </div>
          </SettingCard>

          <button
            type="button"
            onClick={logout}
            className="w-full px-4 py-3 rounded-xl border border-red-400/15 bg-red-400/[0.04] hover:bg-red-400/[0.08] text-red-400 font-semibold text-sm transition-all cursor-pointer active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5a2 2 0 0 0-2-2h-6" />
            </svg>
            {t.logout}
          </button>
        </aside>
      </div>

      <Modal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        title={t.whatsappTitle}
        description={t.integrationDesc}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.8L3 21l1.8-4.3a8.7 8.7 0 1 1 16.2-5.2Z" /><path d="M8.8 8.4c.5 2.5 2.3 4.3 4.8 4.8" />
          </svg>
        }
        footer={
          <>
            <button type="button" onClick={() => setWhatsappModalOpen(false)} className="btn-secondary">
              {t.cancel}
            </button>
            <button type="button" onClick={handleSaveWhatsapp} className="btn-primary">
              {savedMessage ? <><CheckIcon /> {t.savedOk}</> : t.saveConfig}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl brand-gradient-soft border border-[var(--color-border-accent)] p-4">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t.whatsappSteps}</p>
            <ol className="mt-2.5 space-y-2 text-xs text-[var(--color-text-secondary)] leading-relaxed list-decimal pl-4">
              <li>{t.step1}</li>
              <li>{t.step2}</li>
              <li>{t.step3}</li>
            </ol>
          </div>

          <div className="grid md:grid-cols-[minmax(0,1fr)_170px] gap-5 items-start">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">{t.sandboxCode}</label>
                <input
                  type="text"
                  value={sandboxCode}
                  onChange={(event) => setSandboxCode(event.target.value)}
                  placeholder="join simple-giant"
                  className="fryd-input font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-2 block">{t.phone}</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="+5215512345678"
                  className="fryd-input font-mono"
                />
              </div>
              <label className="flex items-center justify-between gap-4 rounded-xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] p-3.5 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.reminders}</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{t.remindersDesc}</p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappActive}
                  onChange={(event) => setWhatsappActive(event.target.checked)}
                  className="h-5 w-5 rounded border-white/20 bg-white/5 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer"
                />
              </label>
            </div>

            <div className="rounded-2xl bg-[var(--color-surface-input)] border border-[var(--color-border-subtle)] p-3 min-h-[170px] flex flex-col items-center justify-center text-center">
              {isValidSandbox ? (
                <>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(`https://wa.me/14155238886?text=${encodeURIComponent(sandboxCode)}`)}&color=0f172a&bgcolor=ffffff`}
                    alt="WhatsApp QR Code"
                    className="w-[132px] h-[132px] rounded-xl border-4 border-white shadow-sm"
                  />
                  <a
                    href={`https://wa.me/14155238886?text=${encodeURIComponent(sandboxCode)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 text-[11px] font-semibold text-[var(--color-accent-primary)] hover:underline"
                  >
                    {t.openWhatsapp}
                  </a>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] flex items-center justify-center mb-2">
                    <span className="text-lg">⌁</span>
                  </div>
                  <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">{t.qrError}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
