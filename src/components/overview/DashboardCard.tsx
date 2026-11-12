import type { ReactNode } from "react";

/** Natural-height sections share geometry while the active ledger owns tokens. */
export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`dashboard-card ${className}`} aria-label={title}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-meta text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
