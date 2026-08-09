import type { ReactNode } from "react";

type StatTileProps = {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: "brand" | "success" | "warning" | "muted";
};

export default function StatTile({ label, value, detail, icon, tone = "brand" }: StatTileProps) {
  return (
    <div className={`fryd-stat-tile fryd-stat-${tone}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-[var(--color-text-muted)]">{label}</p>
          <div className="mt-1.5 text-2xl font-bold tracking-[-0.03em] text-[var(--color-text-primary)]">{value}</div>
          {detail && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{detail}</p>}
        </div>
        {icon && <div className="fryd-stat-icon">{icon}</div>}
      </div>
    </div>
  );
}
