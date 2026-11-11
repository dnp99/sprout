"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

export type GroupReportStat = { label: string; value: string; tone?: "positive" | "negative" };

/** Identical neutral surfaces keep the value's semantic ink meaningful. */
export function GroupReportKpis({ items }: { items: GroupReportStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-group-report-kpis>
      {items.map(({ label, value, tone }) => (
        <div
          key={label}
          className="min-w-0 rounded-[10px] border border-edge bg-card p-3 lg:rounded-[14px] lg:p-4"
        >
          <div className="text-label font-medium text-muted">{label}</div>
          <div
            className={`mt-2 break-words text-[20px] font-bold leading-tight tracking-tight tabular-nums [overflow-wrap:anywhere] lg:text-[24px] ${tone === "positive" ? "text-green" : tone === "negative" ? "text-danger" : "text-ink"}`}
          >
            {value}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupReportCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[10px] border border-edge bg-card p-3.5 lg:rounded-[14px] lg:p-[18px]">
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

/** Long lists remain available without making the initial report a wall of rows. */
export function GroupReportRows({
  rows,
  empty,
}: {
  rows: {
    id: string;
    label: string;
    value: string;
    detail?: string;
    tone?: "positive" | "negative";
  }[];
  empty: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("groupTrends");
  return (
    <>
      {!rows.length && <p className="py-3 text-body text-muted">{empty}</p>}
      <ul className="space-y-1">
        {(expanded ? rows : rows.slice(0, 5)).map((row) => (
          <li
            key={row.id}
            className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-1.5 text-body"
          >
            <span className="min-w-0 flex-1 break-words">
              {row.label}
              {row.detail && (
                <span className="ml-2 inline text-meta font-normal text-muted">{row.detail}</span>
              )}
            </span>
            <strong
              className={`ml-auto max-w-full break-words text-right font-semibold tabular-nums [overflow-wrap:anywhere] ${row.tone === "positive" ? "text-green" : row.tone === "negative" ? "text-danger" : "text-ink"}`}
            >
              {row.value}
            </strong>
          </li>
        ))}
      </ul>
      {rows.length > 5 && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="mt-2 min-h-11 rounded-[8px] px-2 text-label font-semibold text-primary hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          {t(expanded ? "showLess" : "viewAll", { count: rows.length })}
        </button>
      )}
    </>
  );
}
