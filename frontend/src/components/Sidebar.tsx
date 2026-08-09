import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import BrandMark from "./BrandMark";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuKey =
  | "Inicio"
  | "Tareas"
  | "Hábitos"
  | "Diario"
  | "Asistente"
  | "Analíticas"
  | "Proyectos"
  | "Panel Admin";

const translations = {
  es: {
    Inicio: "Inicio",
    Tareas: "Tareas",
    Hábitos: "Hábitos",
    Diario: "Diario",
    Asistente: "Cerebro Digital",
    Analíticas: "Analíticas",
    Proyectos: "Proyectos",
    "Panel Admin": "Panel Admin",
    profile: "Ver perfil",
    settings: "Configuración",
    yourSpace: "Tu espacio",
    intelligence: "Inteligencia",
    work: "Trabajo",
    administration: "Administración",
  },
  en: {
    Inicio: "Home",
    Tareas: "Tasks",
    Hábitos: "Habits",
    Diario: "Diary",
    Asistente: "Digital Brain",
    Analíticas: "Analytics",
    Proyectos: "Projects",
    "Panel Admin": "Admin Panel",
    profile: "View profile",
    settings: "Settings",
    yourSpace: "Your space",
    intelligence: "Intelligence",
    work: "Work",
    administration: "Administration",
  },
};

const icons: Record<MenuKey, ReactNode> = {
  Inicio: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Tareas: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8.5 12l2.2 2.2L15.8 9" />
    </svg>
  ),
  Hábitos: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 11-2.34-5.66" />
      <path d="M20 4v5h-5" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  ),
  Diario: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5A2.5 2.5 0 017.5 2H20v17H7.5A2.5 2.5 0 005 21.5v-17z" />
      <path d="M5 4.5v17" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  ),
  Asistente: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.05 3.02A4.7 4.7 0 0016 8.95L19 10l-3 1.05A4.7 4.7 0 0013.05 14L12 17l-1.05-3A4.7 4.7 0 008 11.05L5 10l3-1.05A4.7 4.7 0 0010.95 6L12 3z" />
      <path d="M19 16l.6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6L19 16z" />
    </svg>
  ),
  Analíticas: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V10M10 19V5M16 19v-7M22 19V8" />
    </svg>
  ),
  Proyectos: (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 5V3h8v2M3 10h18" />
    </svg>
  ),
  "Panel Admin": (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="M8 9h8M8 13h5M8 17h3" />
    </svg>
  ),
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { language, user } = useAuth();
  const t = language === "en" ? translations.en : translations.es;
  const focus = user?.profile_focus || "personal";
  const userName = user?.username || user?.email?.split("@")[0] || (language === "en" ? "My profile" : "Mi perfil");
  const initial = userName.trim().charAt(0).toUpperCase() || "F";

  const groups: Array<{ label: string; items: Array<{ key: MenuKey; path: string }> }> = [
    {
      label: t.yourSpace,
      items: [
        { key: "Inicio" as MenuKey, path: "/" },
        { key: "Tareas" as MenuKey, path: "/task" },
        { key: "Hábitos" as MenuKey, path: "/habit" },
        { key: "Diario" as MenuKey, path: "/diary" },
      ],
    },
    {
      label: t.intelligence,
      items: [
        { key: "Asistente" as MenuKey, path: "/assistant" },
        { key: "Analíticas" as MenuKey, path: "/analytics" },
      ],
    },
    {
      label: t.work,
      items: (focus === "personal" ? [] : [{ key: "Proyectos" as MenuKey, path: "/projects" }]),
    },
    {
      label: t.administration,
      items: (user?.is_admin ? [{ key: "Panel Admin" as MenuKey, path: "/admin" }] : []),
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col w-[var(--sidebar-width)]
          border-r border-[var(--color-border-subtle)] bg-[rgba(8,14,27,0.94)] backdrop-blur-2xl
          transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-6 pt-7 pb-7">
          <BrandMark />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-7">
            {groups.map((group) => (
              <section key={group.label}>
                <p className="fryd-section-label px-3 mb-2.5">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                    const label = t[item.key];

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                          isActive
                            ? "text-white bg-[rgba(99,102,241,0.11)] border border-[rgba(99,102,241,0.12)]"
                            : "text-[var(--color-text-secondary)] border border-transparent hover:text-white hover:bg-white/[0.035]"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full brand-gradient" />
                        )}
                        <span className={`flex-shrink-0 transition-colors ${isActive ? "text-[#9da5ff]" : "text-[#8793ad] group-hover:text-[var(--color-text-primary)]"}`}>
                          {icons[item.key]}
                        </span>
                        <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="px-3 pb-3">
          <Link
            to="/user"
            onClick={onClose}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-200 ${
              location.pathname === "/user"
                ? "border-[rgba(99,102,241,0.28)] bg-[rgba(99,102,241,0.10)]"
                : "border-[var(--color-border-subtle)] bg-white/[0.025] hover:bg-white/[0.045] hover:border-[var(--color-border-default)]"
            }`}
          >
            <div className="brand-gradient w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-[0_0_24px_rgba(99,102,241,0.16)]">
              <span className="text-sm font-bold text-white">{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{userName}</p>
              <p className="truncate text-[11px] text-[var(--color-text-muted)]">{t.profile}</p>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          <Link to="/user" onClick={onClose} className="mt-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-white/[0.035] hover:text-white transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 .6 1.7 1.7 0 00-.4 1V21h-4v-.08a1.7 1.7 0 00-1.1-1.52 1.7 1.7 0 00-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-.6-1 1.7 1.7 0 00-1-.4H3v-4h.08A1.7 1.7 0 004.6 8.5a1.7 1.7 0 00-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-.6 1.7 1.7 0 00.4-1V3h4v.08A1.7 1.7 0 0015.5 4.6a1.7 1.7 0 001.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0019.4 9c.36.3.58.74.6 1.2V10h1v4h-.08A1.7 1.7 0 0019.4 15z" />
            </svg>
            {t.settings}
          </Link>
        </div>

        <div className="px-6 py-4 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-[10px] text-[var(--color-text-muted)]">
          <span>FRYD v1.0.0</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-success)]" /> online</span>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
