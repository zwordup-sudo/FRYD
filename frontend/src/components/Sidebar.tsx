import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const translations = {
  es: {
    "Inicio": "Inicio",
    "Tareas": "Tareas",
    "Hábitos": "Hábitos",
    "Diario": "Diario",
    "Asistente": "Asistente",
    "Analíticas": "Analíticas",
    "Proyectos": "Proyectos",
    "Mi Perfil": "Mi Perfil",
    "Configuración": "Configuración",
    "Productivity": "Productividad"
  },
  en: {
    "Inicio": "Home",
    "Tareas": "Tasks",
    "Hábitos": "Habits",
    "Diario": "Diary",
    "Asistente": "Assistant",
    "Analíticas": "Analytics",
    "Proyectos": "Projects",
    "Mi Perfil": "My Profile",
    "Configuración": "Settings",
    "Productivity": "Productivity"
  }
};

const menuItems = [
  {
    nameKey: "Inicio",
    path: "/",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    nameKey: "Tareas",
    path: "/task",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    nameKey: "Hábitos",
    path: "/habit",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
        <path d="M12 8v4l3 3" />
        <path d="M16 2l4 4" />
        <path d="M20 2l-4 4" />
      </svg>
    ),
  },
  {
    nameKey: "Diario",
    path: "/diary",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
        <path d="M7 8h10M7 12h7M7 16h4" />
      </svg>
    ),
  },
  {
    nameKey: "Asistente",
    path: "/assistant",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 017 7v1a7 7 0 01-14 0V9a7 7 0 017-7z" />
        <path d="M8 21h8M12 17v4" />
        <circle cx="9" cy="9" r="1" fill="currentColor" />
        <circle cx="15" cy="9" r="1" fill="currentColor" />
        <path d="M9 13c1.5 1.5 4.5 1.5 6 0" />
      </svg>
    ),
  },
  {
    nameKey: "Analíticas",
    path: "/analytics",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    nameKey: "Proyectos",
    path: "/projects",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
      </svg>
    ),
  },
];

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { language, user } = useAuth();
  const t = language === "en" ? translations.en : translations.es;
  const focus = user?.profile_focus || "personal";

  const filteredMenuItems = menuItems.filter((item) => {
    if (focus === "personal") {
      // Ocultar proyectos en perfil personal
      if (item.nameKey === "Proyectos") return false;
    }
    return true;
  });

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          w-[var(--sidebar-width)] glass-strong
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:relative lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center shadow-lg">
              <span className="text-base font-extrabold text-[var(--color-text-inverse)] tracking-tight">F</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-[var(--color-text-primary)]">
                FRYD
              </h1>
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-[var(--color-text-muted)]">
                {t["Productivity"]}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 flex flex-col gap-1">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const displayName = t[item.nameKey as keyof typeof t] || item.nameKey;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`
                  group flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                  transition-all duration-200 relative overflow-hidden
                  ${
                    isActive
                      ? "bg-[var(--color-accent-primary-glow)] text-[var(--color-accent-primary)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04]"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-accent-primary)]" />
                )}

                <span className={`
                  flex-shrink-0 transition-all duration-200
                  ${isActive ? "drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" : "group-hover:scale-105"}
                `}>
                  {item.icon}
                </span>

                <span className={`
                  text-sm transition-all duration-200
                  ${isActive ? "font-semibold" : "font-medium"}
                `}>
                  {displayName}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4">
          <Link
            to="/user"
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3.5 py-3 rounded-xl
              transition-all duration-200
              ${
                location.pathname === "/user"
                  ? "bg-[var(--color-accent-primary-glow)] text-[var(--color-accent-primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/[0.04]"
              }
            `}
          >
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-profile-gradient)" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t["Mi Perfil"]}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">{t["Configuración"]}</p>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border-default)]">
          <p className="text-[11px] text-[var(--color-text-muted)]">
            FRYD v1.0 — <span className="text-[var(--color-accent-primary)]">Focus. Reflect. Build.</span>
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;