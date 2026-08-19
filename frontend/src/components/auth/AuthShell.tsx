import type { ReactNode } from "react";
import BrandMark from "../BrandMark";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  contentWidth?: "default" | "wide";
  variant?: "classic" | "login-concept-2";
};

const FeatureIcon = ({ children }: { children: ReactNode }) => (
  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-[var(--color-text-primary)]">
    {children}
  </div>
);

function LoginConceptHero() {
  return (
    <section className="auth-c2-hero" aria-label="FRYD — Tu sistema personal">
      <div className="auth-c2-orbit" aria-hidden="true">
        <span className="auth-c2-orbit-line auth-c2-orbit-line-1" />
        <span className="auth-c2-orbit-line auth-c2-orbit-line-2" />
        <span className="auth-c2-orbit-line auth-c2-orbit-line-3" />
        <span className="auth-c2-orbit-glow" />
        <span className="auth-c2-orbit-dot" />
      </div>

      <div className="auth-c2-hero-inner">
        <BrandMark className="auth-c2-brand" />

        <div className="auth-c2-copy">
          <div className="auth-c2-eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
            </svg>
            Tu sistema personal
          </div>

          <h1 className="auth-c2-title">
            <span>Convierte</span>
            <span>intención en</span>
            <span>progreso<span className="auth-c2-title-dot">.</span></span>
          </h1>

          <p className="auth-c2-description">
            Tareas, hábitos, diario, proyectos e inteligencia conectados en un solo espacio que evoluciona contigo.
          </p>

          <div className="auth-c2-features">
            <article className="auth-c2-feature auth-c2-feature-purple">
              <div className="auth-c2-feature-icon" aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="5" width="16" height="15" rx="3" />
                  <path d="M8 3v4M16 3v4M8.5 12l2.2 2.2L15.5 9.5" />
                </svg>
              </div>
              <h3>Organiza</h3>
              <p>Captura lo importante y mantén el enfoque.</p>
              <span className="auth-c2-feature-accent" />
            </article>

            <article className="auth-c2-feature auth-c2-feature-blue">
              <div className="auth-c2-feature-icon" aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="8" r="2.5" />
                  <circle cx="16.5" cy="9.5" r="2" />
                  <path d="M4.5 18a4.5 4.5 0 0 1 9 0M13.5 17.5a3.5 3.5 0 0 1 6 0" />
                </svg>
              </div>
              <h3>Conecta</h3>
              <p>Une tu contexto y todo lo que importa.</p>
              <span className="auth-c2-feature-accent" />
            </article>

            <article className="auth-c2-feature auth-c2-feature-teal">
              <div className="auth-c2-feature-icon" aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 17l5-5 3 3 7-8" />
                  <path d="M15 7h4v4" />
                </svg>
              </div>
              <h3>Avanza</h3>
              <p>Decide con claridad y mide tu progreso.</p>
              <span className="auth-c2-feature-accent" />
            </article>
          </div>

          <div className="auth-c2-insight">
            <div className="auth-c2-insight-icon" aria-hidden="true">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2.8l2 5.2 5.2 2-5.2 2-2 5.2-2-5.2-5.2-2 5.2-2 2-5.2z" />
              </svg>
            </div>
            <div className="auth-c2-insight-copy">
              <p className="auth-c2-insight-label">FRYD Insight</p>
              <p>Con tu información conectada, FRYD puede ayudarte a reconocer patrones y decidir qué merece atención.</p>
            </div>
            <svg className="auth-c2-insight-arrow" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AuthShell({
  children,
  eyebrow = "Tu sistema personal",
  title = "Convierte intención en progreso.",
  description = "Tareas, hábitos, diario, proyectos e inteligencia conectados en un solo espacio que evoluciona contigo.",
  contentWidth = "default",
  variant = "classic",
}: AuthShellProps) {
  if (variant === "login-concept-2") {
    return (
      <main className="auth-shell auth-shell-c2">
        <div className="auth-c2-noise" aria-hidden="true" />
        <div className="auth-c2-layout">
          <LoginConceptHero />

          <section className="auth-c2-stage">
            <div className="auth-c2-stage-glow auth-c2-stage-glow-top" aria-hidden="true" />
            <div className="auth-c2-stage-glow auth-c2-stage-glow-bottom" aria-hidden="true" />

            <div className="auth-c2-mobile-brand">
              <BrandMark />
              <span className="auth-c2-mobile-status">
                <span /> Espacio personal
              </span>
            </div>

            <div className={`auth-c2-login-card ${contentWidth === "wide" ? "auth-c2-login-card-wide" : ""}`}>
              <div className="auth-c2-card-glow" aria-hidden="true" />
              <div className="auth-c2-card-content animate-fade-in">{children}</div>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-shell relative min-h-screen overflow-hidden bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none absolute inset-0 auth-grid opacity-35" />
      <div className="pointer-events-none absolute -left-28 top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-indigo-500/[0.11] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-teal-400/[0.08] blur-[130px]" />
      <div className="pointer-events-none absolute left-[42%] top-[28%] h-[18rem] w-[18rem] rounded-full bg-blue-500/[0.06] blur-[100px]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
        <section className="hidden min-h-screen border-r border-[var(--color-border-subtle)] px-10 py-10 lg:flex xl:px-16 xl:py-14">
          <div className="mx-auto flex w-full max-w-[43rem] flex-col">
            <BrandMark />

            <div className="my-auto max-w-[39rem] py-16">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/[0.07] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-tertiary)] shadow-[0_0_12px_rgba(20,184,166,.8)]" />
                {eyebrow}
              </div>

              <h1 className="max-w-[9.5ch] text-[clamp(2.8rem,4.2vw,4.6rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-white">
                {title}
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-text-secondary)] xl:text-[1.05rem]">
                {description}
              </p>

              <div className="mt-12 flex max-w-xl flex-wrap gap-3">
                <div className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-white/[0.025] px-4 py-3">
                  <FeatureIcon>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  </FeatureIcon>
                  <div>
                    <p className="text-sm font-semibold text-white">Organiza</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Captura lo importante.</p>
                  </div>
                </div>

                <div className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-white/[0.025] px-4 py-3">
                  <FeatureIcon>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M2 12h20" />
                      <circle cx="12" cy="12" r="4" />
                    </svg>
                  </FeatureIcon>
                  <div>
                    <p className="text-sm font-semibold text-white">Conecta</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Une tu contexto.</p>
                  </div>
                </div>

                <div className="flex min-w-[10rem] flex-1 items-center gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-white/[0.025] px-4 py-3">
                  <FeatureIcon>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 17l6-6 4 4 8-9" />
                      <path d="M15 6h6v6" />
                    </svg>
                  </FeatureIcon>
                  <div>
                    <p className="text-sm font-semibold text-white">Avanza</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">Decide con claridad.</p>
                  </div>
                </div>
              </div>

              <div className="relative mt-12 max-w-xl overflow-hidden rounded-[1.35rem] border border-[var(--color-border-default)] bg-[#0b1426]/66 px-5 py-4 backdrop-blur-xl">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gradient-soft)] text-indigo-200">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="fryd-section-label">FRYD Insight</p>
                    <p className="mt-1.5 text-sm leading-6 text-[var(--color-text-secondary)]">
                      Con tu información conectada, FRYD puede ayudarte a reconocer patrones y decidir qué merece atención ahora.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <footer className="flex items-center justify-between gap-4 text-[11px] text-[var(--color-text-muted)]">
              <span>FRYD · Organiza · Avanza · Logra</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-success)]" />
                Espacio personal seguro
              </span>
            </footer>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-10 xl:px-16">
          <div className={`w-full animate-fade-in ${contentWidth === "wide" ? "max-w-[39rem]" : "max-w-[31rem]"}`}>
            <div className="mb-9 flex items-center justify-between lg:hidden">
              <BrandMark />
              <span className="rounded-full border border-[var(--color-border-default)] bg-white/[0.025] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                Espacio personal
              </span>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
