import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between mb-9">
      <div className="min-w-0">
        {eyebrow && <p className="fryd-section-label mb-2">{eyebrow}</p>}
        <h1 className="text-3xl sm:text-[2rem] font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </header>
  );
}
