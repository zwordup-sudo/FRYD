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
    yourSpace: "Your space",
    intelligence: "Intelligence",
    work: "Work",
    administration: "Administration",
  },
};

const icons: Record<MenuKey, ReactNode> = {
  Inicio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  ),
  Tareas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8.5 12l2.2 2.2L15.8 9" />
    </svg>
  ),
  Hábitos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12a8 8 0 11-2.34-5.66" />
      <path d="M20 4v5h-5" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  ),
  Diario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4.5A2.5 2.5 0 017.5 2H20v17H7.5A2.5 2.5 0 005 21.5v-17z" />
      <path d="M5 4.5v17" />
      <path d="M9 7h7M9 11h5" />
    </svg>
  ),
  Asistente: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.05 3.02A4.7 4.7 0 0016 8.95L19 10l-3 1.05A4.7 4.7 0 0013.05 14L12 17l-1.05-3A4.7 4.7 0 008 11.05L5 10l3-1.05A4.7 4.7 0 0010.95 6L12 3z" />
      <path d="M19 16l.6 1.4L21 18l-1.4.6L19 20l-.6-1.4L17 18l1.4-.6L19 16z" />
    </svg>
  ),
  Analíticas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V10M10 19V5M16 19v-7M22 19V8" />
    </svg>
  ),
  Proyectos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 5V3h8v2M3 10h18" />
    </svg>
  ),
  "Panel Admin": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v5c0 4.55-2.77 8.02-7 10-4.23-1.98-7-5.45-7-10V6l7-3z" />
      <path d="M9.5 12l1.6 1.6 3.7-3.7" />
    </svg>
  ),
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { language, user } = useAuth();
  const t = language === "en" ? translations.en : translations.es;
  const focus = user?.profile_focus || "personal";
  const userName = user?.username || user?.email?.split("@")[0] || (language === "en" ? "My profile" : "Mi perfil");
  const userEmail = user?.email || (language === "en" ? "View profile" : "Ver perfil");
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
      items: focus === "personal" ? [] : [{ key: "Proyectos" as MenuKey, path: "/projects" }],
    },
    {
      label: t.administration,
      items: user?.is_admin ? [{ key: "Panel Admin" as MenuKey, path: "/admin" }] : [],
    },
  ].filter((group) => group.items.length > 0);

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fryd-sidebar-overlay-v15 fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        id="fryd-sidebar-navigation"
        className={`fryd-sidebar fixed left-0 top-0 z-50 flex h-screen w-[var(--sidebar-width)] flex-col transition-transform duration-300 ease-in-out lg:relative lg:z-auto lg:translate-x-0 ${
          isOpen ? "is-open translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="fryd-sidebar-ambient" aria-hidden="true" />

        <header className="relative z-10 px-5 pb-6 pt-6">
          <div className="fryd-sidebar-brand">
            <BrandMark />
          </div>
        </header>

        <nav className="relative z-10 flex-1 overflow-y-auto px-3 pb-5 fryd-sidebar-scrollbar">
          <div className="space-y-7">
            {groups.map((group) => (
              <section key={group.label}>
                <div className="mb-2.5 flex items-center gap-2 px-3">
                  <p className="fryd-sidebar-section-label">{group.label}</p>
                  <span className="fryd-sidebar-section-dot" aria-hidden="true" />
                </div>

                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(`${item.path}/`));
                    const label = t[item.key];

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={onClose}
                        className={`fryd-sidebar-item group ${isActive ? "is-active" : ""}`}
                      >
                        <span className="fryd-sidebar-active-line" aria-hidden="true" />
                        <span className="fryd-sidebar-icon" aria-hidden="true">
                          {icons[item.key]}
                        </span>
                        <span className="fryd-sidebar-item-label">{label}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </nav>

        <div className="relative z-10 px-3 pb-4 pt-2">
          <Link
            to="/user"
            onClick={onClose}
            className={`fryd-sidebar-profile ${location.pathname === "/user" ? "is-active" : ""}`}
          >
            <div className="fryd-sidebar-avatar">
              <span>{initial}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{userName}</p>
                {user?.is_admin && <span className="fryd-sidebar-role">Admin</span>}
              </div>
              <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">{userEmail}</p>
            </div>
            <svg className="fryd-sidebar-profile-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
