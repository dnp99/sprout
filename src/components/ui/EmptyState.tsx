/** Friendly placeholder for a screen or section with no data yet. */
export function EmptyState({
  emoji,
  title,
  subtitle,
  action,
  className = "",
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center rounded-card bg-card px-6 py-10 text-center ${className}`}
    >
      <span className="text-4xl">{emoji}</span>
      <div className="mt-3 text-[15px] font-extrabold text-ink">{title}</div>
      {subtitle && (
        <div className="mt-1.5 max-w-[260px] text-[12.5px] font-semibold leading-relaxed text-muted">
          {subtitle}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
