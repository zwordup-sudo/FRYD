import type { ReactNode } from "react";
import BrandMark from "../BrandMark";

type AuthShellProps = {
  children: ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  contentWidth?: "default" | "wide";
};

const FeatureIcon = ({ children }: { children: ReactNode }) => (
  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.045] text-[var(--color-text-primary)]">
    {children}
  </div>
);

export default function AuthShell({
  children,
  eyebrow = "Tu sistema personal",
  title = "Convierte intención en progreso.",
  description = "Tareas, hábitos, diario, proyectos e inteligencia conectados en un solo espacio que evoluciona contigo.",
  contentWidth = "default",
}: AuthShellProps) {
  return (
    <main className="auth-shell relative min-h-screen overflow-hidden bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <div className="pointer-events-none absolute inset-0 auth-grid opacity-35" />
      <div className="pointer-events-none absolute -left-28 top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-indigo-500/[0.11] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-12rem] right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-teal-400/[0.08] blur-[130px]" />
      <div className="pointer-events-none absolute left-[42%] top-[28%] h-[18rem] w-[18rem] rounded-full bg-blue-500/[0.06] blur-[100px]" />

      <div className="relative z-10 grid min-h-screen lg:grid-cols-[minmax(0,1.08fr)_minmax(28rem,0.92fr)]">
        {/* Brand side: deliberately calmer and less dense than the form side. */}
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

              {/* Compact value props replace the previous three large cards. */}
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

        {/* Form side intentionally preserved: user feedback indicated this area already works well. */}
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
