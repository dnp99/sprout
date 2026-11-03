"use client";

import { useTranslations } from "next-intl";

/** Selection belongs beside results so it never narrows the live search field. */
export function MobileSelectionBar({
  count,
  selectedCount,
  active,
  onStart,
  onDone,
  onSelectAll,
  disabled = false,
}: {
  count: number;
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
        {active ? t("selectedN", { count: selectedCount }) : t("summaryCount", { count })}
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
    </div>
  );
}
