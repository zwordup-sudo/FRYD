import { useEffect, useState } from "react";
import { getTasks, getHabits, getDiaryEntries, updateUserSettings } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const GRADIENTS = [
  { id: "indigo-violet", label: "Índigo & Violeta", value: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" },
  { id: "purple-rose", label: "Rosa & Morado", value: "linear-gradient(135deg, #a855f7 0%, #f472b6 100%)" },
  { id: "emerald-teal", label: "Esmeralda & Menta", value: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)" },
  { id: "orange-amber", label: "Naranja & Ámbar", value: "linear-gradient(135deg, #f97316 0%, #f59e0b 100%)" },
  { id: "sky-blue", label: "Celeste & Azul", value: "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)" },
];

const translations = {
  es: {
    profile: "Mi Perfil",
    manage: "Gestiona tu cuenta y preferencias de FRYD.",
    active: "Activo",
    statsTitle: "Tus estadísticas",
    completed: "Completadas",
    pending: "Pendientes",
    activeHabits: "Hábitos activos",
    diaryEntries: "Entradas diario",
    completionRate: "Tasa de completado de tareas",
    accountTitle: "Cuenta",
    username: "Nombre de usuario",
    email: "Correo electrónico",
    edit: "Editar",
    save: "Guardar",
    cancel: "Cancelar",
    preferencesTitle: "Preferencias",
    darkTheme: "Tema oscuro",
    darkThemeDesc: "Alternar entre modo claro y oscuro",
    langLabel: "Idioma",
    langDesc: "Idioma de la interfaz",
    aiLabel: "Asistente IA",
    aiDesc: "Proveedor predeterminado",
    whatsappTitle: "Integración con WhatsApp",
    whatsappDesc: "Recordatorios y Bot de Tareas",
    whatsappDetails: "Recibe notificaciones de tus tareas pendientes y conversa con FRYD directamente por WhatsApp utilizando la API de Twilio.",
    whatsappSteps: "Pasos para conectar:",
    step1: "Busca tu código Sandbox en la consola de Twilio e ingrésalo abajo.",
    step2: "Escanea el código QR de al lado con tu celular o haz clic aquí.",
    step3: "Envía el mensaje por WhatsApp.",
    step4: "Ingresa tu número de WhatsApp y activa los recordatorios abajo.",
    qrLabel: "Escanea para conectar",
    qrError: "Falta ingresar código Sandbox válido",
    saveConfig: "Guardar Configuración",
    savedOk: "¡Guardado correctamente!",
    logout: "Cerrar Sesión",
    aboutTitle: "Acerca de",
    version: "Versión",
    stack: "Stack",
    philosophy: "Filosofía",
    changeAvatarColor: "Color de Perfil",
    focusLabel: "Enfoque de Cuenta",
    focusDesc: "Personaliza las pestañas y herramientas visibles",
    personal: "Personal",
    trabajo: "Trabajo",
    estudiante: "Estudiante",
    empleado: "Empleado"
  },
  en: {
    profile: "My Profile",
    manage: "Manage your FRYD account and preferences.",
    active: "Active",
    statsTitle: "Your Statistics",
    completed: "Completed",
    pending: "Pending",
    activeHabits: "Active Habits",
    diaryEntries: "Diary Entries",
    completionRate: "Task Completion Rate",
    accountTitle: "Account",
    username: "Username",
    email: "Email Address",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    preferencesTitle: "Preferences",
    darkTheme: "Dark Theme",
    darkThemeDesc: "Toggle light and dark mode",
    langLabel: "Language",
    langDesc: "Interface language",
    aiLabel: "AI Assistant",
    aiDesc: "Default AI provider",
    focusLabel: "Account Focus",
    focusDesc: "Customize visible tabs and tools",
    personal: "Personal",
    trabajo: "Work",
    estudiante: "Student",
    empleado: "Employee",
    whatsappTitle: "WhatsApp Integration",
    whatsappDesc: "Reminders & Task Bot",
    whatsappDetails: "Receive notifications of pending tasks and chat with FRYD directly on WhatsApp using Twilio API.",
    whatsappSteps: "Steps to connect:",
    step1: "Find your Sandbox code in the Twilio console and enter it below.",
    step2: "Scan the QR code on the right with your phone or click here.",
    step3: "Send the WhatsApp message.",
    step4: "Enter your WhatsApp number and activate reminders below.",
    qrLabel: "Scan to connect",
    qrError: "Please enter a valid Sandbox code",
    saveConfig: "Save Settings",
    savedOk: "Settings saved successfully!",
    logout: "Log Out",
    aboutTitle: "About",
    version: "Version",
    stack: "Stack",
    philosophy: "Philosophy",
    changeAvatarColor: "Profile Color"
  }
};

export default function UserPage() {
  const { user, logout, updateUser, language, changeLanguage } = useAuth();
  
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeHabits: 0,
    totalHabits: 0,
    diaryEntries: 0,
  });

  // WhatsApp States
  const [phoneNumber, setPhoneNumber] = useState(() => {
    return localStorage.getItem("fryd_whatsapp_phone") || "";
  });
  const [whatsappActive, setWhatsappActive] = useState(() => {
    return localStorage.getItem("fryd_whatsapp_active") === "true";
  });
  const [sandboxCode, setSandboxCode] = useState(() => {
    return localStorage.getItem("fryd_whatsapp_sandbox") || "";
  });
  const [savedMessage, setSavedMessage] = useState(false);

  // Profile Customization States
  const [avatarGradient, setAvatarGradient] = useState(() => {
    return localStorage.getItem("fryd_avatar_gradient") || "linear-gradient(135deg, #818cf8 0%, #f472b6 100%)";
  });

  // Username Editing States
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Preference States
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem("fryd_theme") !== "light";
  });
  const [aiProvider, setAiProvider] = useState("ollama");
  const [profileFocus, setProfileFocus] = useState("personal");

  // Sync state from user object when loaded
  useEffect(() => {
    if (user) {
      setPhoneNumber(user.whatsapp_phone || "");
      setWhatsappActive(!!user.whatsapp_active);
      setSandboxCode(user.whatsapp_sandbox || "");
      setUsernameInput(user.username || "");
      setAiProvider(user.ai_provider || "ollama");
      setProfileFocus(user.profile_focus || "personal");
    }
  }, [user]);

  // Sync theme changes to document
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.remove("light");
      localStorage.setItem("fryd_theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      localStorage.setItem("fryd_theme", "light");
    }
  }, [darkTheme]);



  // Sync AI Provider selection to backend
  const handleAIProviderChange = async (provider: string) => {
    setAiProvider(provider);
    try {
      await updateUserSettings({ ai_provider: provider });
      if (updateUser) {
        updateUser({ ai_provider: provider });
      }
    } catch (err) {
      console.error("Error saving AI provider preference:", err);
    }
  };

  // Sync profile focus selection to backend
  const handleProfileFocusChange = async (focusVal: string) => {
    setProfileFocus(focusVal);
    try {
      await updateUserSettings({ profile_focus: focusVal });
      if (updateUser) {
        updateUser({ profile_focus: focusVal });
      }
    } catch (err) {
      console.error("Error saving profile focus preference:", err);
    }
  };

  // Update avatar gradient preference
  const handleGradientChange = (value: string) => {
    setAvatarGradient(value);
    localStorage.setItem("fryd_avatar_gradient", value);
    document.documentElement.style.setProperty("--profile-gradient", value);
  };

  // Submit username update
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
      if (updateUser) {
        updateUser({ username: cleanUsername });
      }
      setUsernameSuccess(true);
      setIsEditingUsername(false);
      setTimeout(() => setUsernameSuccess(false), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.detail || (language === "en" ? "Error updating username." : "Error al actualizar el nombre de usuario.");
      setUsernameError(msg);
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

      if (updateUser) {
        updateUser({
          whatsapp_phone: phoneNumber,
          whatsapp_active: whatsappActive,
          whatsapp_sandbox: sandboxCode,
        });
      }

      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 2000);
    } catch (err) {
      console.error("Error saving WhatsApp settings to backend:", err);
    }
  };

  const loadStats = async () => {
    try {
      const [tasks, habits, entries] = await Promise.all([
        getTasks(),
        getHabits(),
        getDiaryEntries(),
      ]);
      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: { status: string }) => t.status === "completed").length,
        activeHabits: habits.filter((h: { status: string }) => h.status === "active").length,
        totalHabits: habits.length,
        diaryEntries: entries.length,
      });
    } catch {
      // Silent fail
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
    : 0;

  const isValidSandbox = sandboxCode.trim().toLowerCase().startsWith("join ");
  const t = language === "en" ? translations.en : translations.es;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Profile header */}
      <div className="card-static mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 relative group overflow-hidden"
            style={{ background: avatarGradient }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div className="text-center sm:text-left flex-1">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t.profile}</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {t.manage}
            </p>
            
            {/* Choose Profile Gradient Palette */}
            <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{t.changeAvatarColor}:</span>
              <div className="flex gap-1.5">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => handleGradientChange(g.value)}
                    style={{ background: g.value }}
                    title={g.label}
                    className={`w-5 h-5 rounded-full cursor-pointer transition-transform duration-200 active:scale-95 ${
                      avatarGradient === g.value ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface-elevated)] scale-110" : "hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 justify-center sm:justify-start">
              <span className="badge badge-green">{t.active}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                FRYD v1.0
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
          {t.statsTitle}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-static text-center py-4">
            <p className="text-2xl font-bold text-[var(--color-accent-primary)]">{stats.completedTasks}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{t.completed}</p>
          </div>
          <div className="card-static text-center py-4">
            <p className="text-2xl font-bold text-[var(--color-accent-warning)]">{stats.totalTasks - stats.completedTasks}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{t.pending}</p>
          </div>
          <div className="card-static text-center py-4">
            <p className="text-2xl font-bold text-[var(--color-accent-secondary)]">{stats.activeHabits}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{t.activeHabits}</p>
          </div>
          <div className="card-static text-center py-4">
            <p className="text-2xl font-bold text-[var(--color-accent-tertiary)]">{stats.diaryEntries}</p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1">{t.diaryEntries}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="card-static mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--color-text-secondary)]">{t.completionRate}</span>
            <span className="text-sm font-bold text-[var(--color-accent-primary)]">{completionRate}%</span>
          </div>
          <div className="w-full h-2 bg-[var(--color-surface-input)] rounded-full overflow-hidden">
            <div
              className="h-full gradient-green rounded-full transition-all duration-700"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="space-y-4">
        {/* Account */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t.accountTitle}
          </h2>
          <div className="card-static">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] block">{t.username}</label>
                  {!isEditingUsername ? (
                    <button
                      onClick={() => {
                        setUsernameInput(user?.username || "");
                        setIsEditingUsername(true);
                      }}
                      className="text-xs font-semibold text-[var(--color-accent-primary)] hover:underline cursor-pointer"
                    >
                      {t.edit}
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveUsername}
                        className="text-xs font-semibold text-[var(--color-accent-primary)] hover:underline cursor-pointer"
                      >
                        {t.save}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsernameError("");
                        }}
                        className="text-xs font-semibold text-[var(--color-text-muted)] hover:underline cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  )}
                </div>
                {isEditingUsername ? (
                  <input
                    type="text"
                    className="fryd-input focus:border-[var(--color-accent-primary)]"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                  />
                ) : (
                  <input
                    type="text"
                    className="fryd-input opacity-80 cursor-not-allowed bg-[var(--color-surface-input)]/50"
                    value={user?.username || ""}
                    disabled
                  />
                )}
                {usernameError && (
                  <p className="text-xs text-red-400 mt-1 font-semibold">{usernameError}</p>
                )}
                {usernameSuccess && (
                  <p className="text-xs text-emerald-400 mt-1 font-semibold animate-pulse">
                    {language === "en" ? "Username updated successfully!" : "¡Nombre de usuario actualizado!"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">{t.email}</label>
                <input
                  type="email"
                  className="fryd-input opacity-80 cursor-not-allowed bg-[var(--color-surface-input)]/50"
                  value={user?.email || ""}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t.preferencesTitle}
          </h2>
          <div className="card-static">
            <div className="space-y-4">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.darkTheme}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.darkThemeDesc}</p>
                </div>
                <button
                  onClick={() => setDarkTheme(!darkTheme)}
                  className={`w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer transition-colors duration-300 ${
                    darkTheme ? "bg-[var(--color-accent-primary)]" : "bg-slate-300 dark:bg-slate-700"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    darkTheme ? "translate-x-5" : "translate-x-0"
                  }`} />
                </button>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]" />

              {/* Language Switcher */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.langLabel}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.langDesc}</p>
                </div>
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="bg-[var(--color-surface-input)] border border-[var(--color-border-default)] rounded-lg text-xs text-[var(--color-text-primary)] px-2.5 py-1.5 font-medium focus:ring-[var(--color-accent-primary)] cursor-pointer"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]" />

              {/* AI Provider selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.aiLabel}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.aiDesc}</p>
                </div>
                <select
                  value={aiProvider}
                  onChange={(e) => handleAIProviderChange(e.target.value)}
                  className="bg-[var(--color-surface-input)] border border-[var(--color-border-default)] rounded-lg text-xs text-[var(--color-text-primary)] px-2.5 py-1.5 font-medium focus:ring-[var(--color-accent-primary)] cursor-pointer"
                >
                  <option value="ollama">🦙 Ollama</option>
                  <option value="openai">🤖 OpenAI</option>
                  <option value="anthropic">🧠 Anthropic</option>
                  <option value="gemini">✨ Gemini</option>
                </select>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]" />

              {/* Account Focus selector */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{t.focusLabel}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{t.focusDesc}</p>
                </div>
                <select
                  value={profileFocus}
                  onChange={(e) => handleProfileFocusChange(e.target.value)}
                  className="bg-[var(--color-surface-input)] border border-[var(--color-border-default)] rounded-lg text-xs text-[var(--color-text-primary)] px-2.5 py-1.5 font-medium focus:ring-[var(--color-accent-primary)] cursor-pointer"
                >
                  <option value="personal">🏠 {t.personal}</option>
                  <option value="trabajo">💼 {t.trabajo}</option>
                  <option value="estudiante">🎓 {t.estudiante}</option>
                  <option value="empleado">👔 {t.empleado}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Integration */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t.whatsappTitle}
          </h2>
          <div className="card-static">
            <div className="space-y-4">
              <div className="flex items-start gap-3.5 mb-2">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{t.whatsappDesc}</h3>
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-relaxed">
                    {t.whatsappDetails}
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)] pt-4 flex flex-col md:flex-row gap-5 items-center">
                <div className="flex-1 space-y-3">
                  <h4 className="text-xs font-semibold text-[var(--color-accent-primary)] uppercase tracking-wider">
                    {t.whatsappSteps}
                  </h4>
                  <ol className="list-decimal list-inside text-xs text-[var(--color-text-secondary)] space-y-2 pl-1 leading-relaxed">
                    <li>{t.step1}</li>
                    <li>
                      {isValidSandbox ? (
                        <>
                          {t.step2.replace("aquí", "")}
                          <a
                            href={`https://wa.me/14155238886?text=${encodeURIComponent(sandboxCode)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--color-accent-primary)] hover:underline font-semibold cursor-pointer"
                          >
                            {language === "en" ? "here" : "aquí"}
                          </a>.
                        </>
                      ) : (
                        <span className="text-[var(--color-text-muted)]">
                          {language === "en" ? "(Enter sandbox code first to enable link)" : "(Ingresa primero un código Sandbox válido abajo para habilitar el código QR/enlace)"}
                        </span>
                      )}
                    </li>
                    <li>{t.step3}</li>
                    <li>{t.step4}</li>
                  </ol>
                </div>

                <div className="flex flex-col items-center p-3 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0 w-[150px] min-h-[170px] justify-center">
                  {isValidSandbox ? (
                    <>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                          `https://wa.me/14155238886?text=${encodeURIComponent(sandboxCode)}`
                        )}&color=059669&bgcolor=ffffff`}
                        alt="WhatsApp QR Code"
                        className="w-[120px] h-[120px] rounded-lg shadow-md border-2 border-white"
                      />
                      <span className="text-[10px] text-[var(--color-text-muted)] mt-2 font-medium">
                        {t.qrLabel}
                      </span>
                    </>
                  ) : (
                    <div className="text-center p-2">
                      <span className="text-2xl block mb-2">⚠️</span>
                      <span className="text-[10px] text-[var(--color-text-muted)] font-medium leading-tight block">
                        {t.qrError}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)] pt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
                    {language === "en" ? "Your Sandbox Code (e.g. join simple-giant)" : "Tu código Sandbox (Ej. join simple-giant)"}
                  </label>
                  <input
                    type="text"
                    value={sandboxCode}
                    onChange={(e) => setSandboxCode(e.target.value)}
                    placeholder="join simple-giant"
                    className="fryd-input font-mono text-xs py-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1 block">
                    {language === "en" ? "Your WhatsApp Number (with country code)" : "Tu número de WhatsApp (con código de país)"}
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Ej. +5215512345678"
                    className="fryd-input font-mono text-xs py-1.5"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{language === "en" ? "Active Reminders" : "Recordatorios Activos"}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{language === "en" ? "Allow task alerts to be sent" : "Permitir envíos de alertas de tareas"}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={whatsappActive}
                    onChange={(e) => setWhatsappActive(e.target.checked)}
                    className="h-5 w-5 rounded border-white/20 bg-white/5 text-[var(--color-accent-primary)] focus:ring-[var(--color-accent-primary)] cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleSaveWhatsapp}
                    className="btn-primary py-1.5 px-4 text-xs cursor-pointer"
                  >
                    {t.saveConfig}
                  </button>
                  {savedMessage && (
                    <span className="text-xs text-emerald-400 font-semibold animate-pulse">
                      {t.savedOk}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
            {t.aboutTitle}
          </h2>
          <div className="card-static">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">{t.version}</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">1.0.0</span>
              </div>
              <div className="border-t border-[var(--color-border-subtle)]" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">{t.stack}</span>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">React + FastAPI</span>
              </div>
              <div className="border-t border-[var(--color-border-subtle)]" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--color-text-secondary)]">{t.philosophy}</span>
                <span className="text-sm text-[var(--color-accent-primary)] font-medium">Focus. Reflect. Build.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action */}
      <div className="mt-8 mb-8 flex justify-center">
        <button
          onClick={logout}
          className="px-6 py-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-semibold text-sm hover:border-red-500/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          {t.logout}
        </button>
      </div>
    </div>
  );
}
