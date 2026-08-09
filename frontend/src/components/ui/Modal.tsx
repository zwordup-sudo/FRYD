import type { ReactNode } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
};

export default function Modal({ open, title, description, icon, children, footer, onClose }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-content fryd-modal" role="dialog" aria-modal="true" aria-labelledby="fryd-modal-title">
        <header className="flex items-start justify-between gap-4 pb-5 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-start gap-3.5 min-w-0">
            {icon && <div className="fryd-modal-icon">{icon}</div>}
            <div className="min-w-0">
              <h2 id="fryd-modal-title" className="text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
                {title}
              </h2>
              {description && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn-ghost p-2 -mr-1 -mt-1" aria-label="Cerrar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="py-6">{children}</div>

        {footer && (
          <footer className="pt-5 border-t border-[var(--color-border-subtle)] flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
