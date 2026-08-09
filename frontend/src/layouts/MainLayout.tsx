import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import BrandMark from "../components/BrandMark";
import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const translations = {
  es: {
    "/": "Inicio",
    "/task": "Tareas",
    "/habit": "Hábitos",
    "/diary": "Diario",
    "/assistant": "Cerebro Digital",
    "/analytics": "Analíticas",
    "/projects": "Proyectos",
    "/user": "Mi Perfil",
    openMenu: "Abrir menú",
    offlineBanner: "Modo sin conexión — Los cambios se sincronizarán al recuperar conexión",
  },
  en: {
    "/": "Home",
    "/task": "Tasks",
    "/habit": "Habits",
    "/diary": "Diary",
    "/assistant": "Digital Brain",
    "/analytics": "Analytics",
    "/projects": "Projects",
    "/user": "My Profile",
    openMenu: "Open menu",
    offlineBanner: "Offline Mode — Changes will sync when online",
  },
};

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const location = useLocation();
  const { language } = useAuth();

  const t = language === "en" ? translations.en : translations.es;
  const title = t[location.pathname as keyof typeof t] || "FRYD";
  const isFullBleed = location.pathname === "/assistant";

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden app-shell-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-500/20 bg-[var(--color-surface-card)]/90 backdrop-blur-md text-amber-300 text-xs font-semibold shadow-lg shadow-black/40 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{t.offlineBanner}</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center h-[var(--header-height)] px-4 border-b border-[var(--color-border-subtle)] bg-[rgba(8,14,27,0.92)] backdrop-blur-xl flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost p-2 -ml-2"
            aria-label={t.openMenu}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="15" y2="12" />
              <line x1="3" y1="18" x2="18" y2="18" />
            </svg>
          </button>

          <h1 className="ml-3 text-base font-semibold text-[var(--color-text-primary)]">{title}</h1>
          <div className="ml-auto"><BrandMark compact /></div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className={isFullBleed ? "content-container-full" : "content-container"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
