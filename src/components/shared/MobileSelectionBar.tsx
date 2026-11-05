"use client";

import { ChevronDown } from "lucide-react";
import { SelectionStatus } from "./SelectionStatus";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

/** A stable list header keeps selection controls reachable without moving rows. */
export function MobileSelectionBar({
  count,
  summary,
  actions,
  selectedCount,
  hiddenCount = 0,
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
  hiddenCount?: number;
  active: boolean;
  onStart: () => void;
  onDone: () => void;
  onSelectAll: () => void;
  disabled?: boolean;
}) {
  const t = useTranslations("txns");
  const action =
    "inline-flex min-h-11 shrink-0 items-center justify-center rounded-[8px] px-2 text-[12px] font-semibold text-primary hover:bg-track disabled:opacity-50";
  return (
    <div
      role={active ? "toolbar" : undefined}
      aria-label={active ? t("bulkActions") : undefined}
      className={`mobile-selection-bar flex min-h-11 shrink-0 items-center gap-1 rounded-[14px] border border-edge px-2 py-0 bg-card ${active ? "sticky top-0 z-30" : ""}`}
    >
      <span aria-live="polite" className="min-w-0 flex-1 text-[12px] text-muted">
        {active ? (
          <SelectionStatus count={selectedCount} hidden={hiddenCount} />
        ) : (
          (summary ?? t("summaryCount", { count }))
        )}
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
            {t("mobileActions")}{" "}
            <ChevronDown size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 top-full z-50 max-h-[45dvh] w-[min(85vw,24rem)] overflow-y-auto rounded-[14px] border border-edge bg-card p-3 shadow-lg">
            {actions}
          </div>
        </details>
      )}
    </div>
  );
}
