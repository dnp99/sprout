"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** Selection belongs beside results so it never narrows the live search field. */
export function MobileSelectionBar({
  count,
  summary,
  actions,
  selectedCount,
  active,
  onStart,
  onDone,
  onSelectAll,
  disabled = false,
}: {
  count: number;
  summary?: ReactNode;
  actions?: ReactNode;
  selectedCount: number;
  active: boolean;
  onStart: () => void;
  onDone: () => void;
  onSelectAll: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("txns");
  const action =
    "min-h-11 rounded-[8px] px-3 text-[12px] font-semibold text-primary hover:bg-track disabled:opacity-50";
  return (
    <div className="mobile-selection-bar flex flex-wrap items-center gap-2 py-1">
      <span aria-live="polite" className="min-w-0 flex-1 text-[12px] text-muted">
        {active
          ? t("selectedN", { count: selectedCount })
          : (summary ?? t("summaryCount", { count }))}
      </span>
      {active && (
        <button
          type="button"
          className={action}
          disabled={disabled || !count}
          onClick={onSelectAll}
        >
          {t("selectAll")}
        </button>
      )}
      <button
        type="button"
        className={action}
        disabled={disabled || (!active && !count)}
        onClick={active ? onDone : onStart}
      >
        {t(active ? "done" : "select")}
      </button>
      {active && actions && (
        <details
          className="relative"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary
            className={`${action} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}
          >
            {t("mobileActions")} <span aria-hidden="true">⌄</span>
          </summary>
          <div className="absolute right-0 top-full z-50 max-h-[45dvh] w-[min(85vw,24rem)] overflow-y-auto rounded-[14px] border border-edge bg-card p-3 shadow-lg">
            {actions}
          </div>
        </details>
      )}
    </div>
  );
}
