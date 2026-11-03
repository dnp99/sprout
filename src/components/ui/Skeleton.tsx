"use client";

import { useTranslations } from "next-intl";

/** Quiet, theme-token placeholders distinguish data loading from app startup. */
export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  const t = useTranslations("loadingIndicator");
  return (
    <div
      role="status"
      aria-label={t("label")}
      aria-busy="true"
      className={`skeleton-rows overflow-hidden rounded-[14px] border border-edge bg-card ${className}`}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex h-14 items-center gap-3 border-b border-edge px-4 last:border-b-0"
        >
          <span className="skeleton-fill h-8 w-8 shrink-0 rounded-[8px]" />
          <span className="flex min-w-0 flex-1 flex-col gap-2">
            <span className={`skeleton-fill h-3 rounded ${index % 2 ? "w-2/5" : "w-3/5"}`} />
            <span className="skeleton-fill h-2 w-1/4 rounded" />
          </span>
          <span className="skeleton-fill h-3 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
