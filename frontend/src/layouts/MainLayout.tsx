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

/*
 * Iteration 15: critical shell CSS travels inside the JS bundle on purpose.
 *
 * The previous responsive attempt depended entirely on a new block appended to
 * index.css. If a deployment/browser served the new component bundle together
 * with an older stylesheet, the sidebar lost its positioning rules and became
 * a full-width block above the page. Keeping the essential shell geometry here
 * makes MainLayout + Sidebar an atomic update and prevents that mixed-version
 * failure mode. The normal design styling still lives in index.css.
 */
const responsiveShellCss = `
  html, body, #root {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    min-height: 100%;
    margin: 0;
    overflow-x: hidden;
  }

  .fryd-shell-v15 {
    position: relative;
    display: flex;
    width: 100%;
    max-width: 100vw;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }

  .fryd-shell-v15 > .fryd-sidebar {
    width: var(--sidebar-width, 17.25rem);
    min-width: var(--sidebar-width, 17.25rem);
    max-width: var(--sidebar-width, 17.25rem);
    height: 100vh;
    height: 100dvh;
    flex: 0 0 var(--sidebar-width, 17.25rem);
    display: flex;
    flex-direction: column;
  }

  .fryd-shell-v15 .fryd-main-column {
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .fryd-shell-v15 .fryd-main-scroll {
    width: 100%;
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
  }

  .fryd-shell-v15 .fryd-mobile-header {
    width: 100%;
    min-width: 0;
    flex: 0 0 auto;
  }

  .fryd-mobile-brand-trigger {
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-primary);
    cursor: pointer;
    transition: background-color 160ms ease, border-color 160ms ease, transform 120ms ease;
    -webkit-tap-highlight-color: transparent;
  }

  .fryd-mobile-brand-trigger > div {
    gap: 0 !important;
  }

  .fryd-mobile-brand-trigger:hover {
    background: rgba(99, 102, 241, .09);
    border-color: rgba(129, 140, 248, .16);
  }

  .fryd-mobile-brand-trigger:active {
    transform: scale(.96);
  }

  .fryd-mobile-brand-trigger:focus-visible {
    outline: 2px solid rgba(96, 165, 250, .85);
    outline-offset: 2px;
  }

  .fryd-sidebar-overlay-v15 {
    position: fixed;
    inset: 0;
    z-index: 55;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    border: 0;
    background: rgba(2, 6, 23, .66);
    backdrop-filter: blur(3px);
    -webkit-backdrop-filter: blur(3px);
  }

  @media (min-width: 1024px) {
    .fryd-shell-v15 > .fryd-sidebar {
      position: relative !important;
      inset: auto !important;
      z-index: 1 !important;
      transform: none !important;
    }

    .fryd-shell-v15 .fryd-main-column {
      width: calc(100vw - var(--sidebar-width, 17.25rem));
      max-width: calc(100vw - var(--sidebar-width, 17.25rem));
    }

    .fryd-shell-v15 .fryd-mobile-header,
    .fryd-shell-v15 .fryd-sidebar-overlay-v15 {
      display: none !important;
    }
  }

  @media (max-width: 1023px) {
    .fryd-shell-v15 {
      display: flex !important;
      width: 100vw !important;
      max-width: 100vw !important;
    }

    .fryd-shell-v15 > .fryd-sidebar {
      position: fixed !important;
      left: 0 !important;
      top: 0 !important;
      right: auto !important;
      bottom: 0 !important;
      z-index: 60 !important;
      width: min(var(--sidebar-width, 17.25rem), 86vw) !important;
      min-width: 0 !important;
      max-width: 86vw !important;
      height: 100vh !important;
      height: 100dvh !important;
      flex: none !important;
      transform: translate3d(-105%, 0, 0) !important;
      transition: transform 280ms cubic-bezier(.4,0,.2,1) !important;
      padding-top: env(safe-area-inset-top);
      padding-bottom: env(safe-area-inset-bottom);
    }

    .fryd-shell-v15 > .fryd-sidebar.is-open {
      transform: translate3d(0, 0, 0) !important;
    }

    .fryd-shell-v15 .fryd-main-column {
      position: relative !important;
      left: 0 !important;
      width: 100vw !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      height: 100% !important;
      flex: 1 1 100% !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    .fryd-shell-v15 .fryd-mobile-header {
      display: flex !important;
      align-items: center;
      min-height: calc(var(--header-height, 4rem) + env(safe-area-inset-top));
      padding: env(safe-area-inset-top) max(1rem, env(safe-area-inset-right)) 0 max(1rem, env(safe-area-inset-left));
      border-bottom: 1px solid var(--color-border-subtle);
      background: rgba(8, 14, 27, .94);
      backdrop-filter: blur(18px);
      -webkit-backdrop-filter: blur(18px);
      position: relative;
      z-index: 30;
    }

    .fryd-shell-v15 .fryd-main-scroll {
      width: 100vw !important;
      max-width: 100vw !important;
      margin: 0 !important;
    }

    .fryd-shell-v15 .content-container,
    .fryd-shell-v15 .content-container-full {
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .fryd-shell-v15 .content-container {
      padding-left: max(1rem, env(safe-area-inset-left)) !important;
      padding-right: max(1rem, env(safe-area-inset-right)) !important;
      padding-bottom: max(1.5rem, env(safe-area-inset-bottom)) !important;
    }
  }

  @media (max-width: 420px) {
    .fryd-shell-v15 .content-container {
      padding-left: max(.875rem, env(safe-area-inset-left)) !important;
      padding-right: max(.875rem, env(safe-area-inset-right)) !important;
    }

    .fryd-shell-v15 .fryd-mobile-header {
      padding-left: max(.875rem, env(safe-area-inset-left));
      padding-right: max(.875rem, env(safe-area-inset-right));
    }
  }
`;

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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="fryd-app-shell fryd-shell-v15 flex h-screen overflow-hidden app-shell-background">
      <style>{responsiveShellCss}</style>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-amber-500/20 bg-[var(--color-surface-card)]/90 backdrop-blur-md text-amber-300 text-xs font-semibold shadow-lg shadow-black/40 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>{t.offlineBanner}</span>
          </div>
        </div>
      )}

      <div className="fryd-main-column flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="fryd-mobile-header lg:hidden flex items-center h-[var(--header-height)] px-4 border-b border-[var(--color-border-subtle)] bg-[rgba(8,14,27,0.92)] backdrop-blur-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="fryd-mobile-brand-trigger flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
            aria-label={t.openMenu}
            aria-expanded={sidebarOpen}
            aria-controls="fryd-sidebar-navigation"
            title={t.openMenu}
          >
            <BrandMark compact />
          </button>

          <h1 className="ml-2 min-w-0 truncate text-base font-semibold text-[var(--color-text-primary)]">{title}</h1>
        </header>

        <main className="fryd-main-scroll flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          <div className={isFullBleed ? "content-container-full" : "content-container"}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
