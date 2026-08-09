interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ compact = false, className = "" }: BrandMarkProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src="/brand/fryd_isotipo.svg"
        alt="FRYD"
        className={`${compact ? "w-8 h-9" : "w-10 h-11"} object-contain flex-shrink-0`}
      />
      {!compact && (
        <div className="min-w-0">
          <div className="text-xl font-bold tracking-[0.24em] text-[var(--color-text-primary)] leading-none">
            FRYD
          </div>
          <p className="mt-1.5 text-[9px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)] whitespace-nowrap">
            Organiza · Avanza · Logra
          </p>
        </div>
      )}
    </div>
  );
}
