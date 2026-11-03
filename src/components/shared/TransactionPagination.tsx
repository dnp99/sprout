"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";

/** Compact paging can live inside a totals footer without taking another row. */
export function TransactionPagination({
  page,
  count,
  pageSize = 50,
  showLabels = false,
  disabled,
  onChange,
}: {
  page: number;
  count: number;
  pageSize?: number;
  showLabels?: boolean;
  disabled: boolean;
  onChange: (page: number) => void;
}) {
  const t = useTranslations("groups");
  if (count <= pageSize) return null;
  return (
    <nav
      aria-label={t("pagination")}
      className="flex shrink-0 items-center justify-center gap-1 text-xs text-muted"
    >
      <button
        type="button"
        aria-label={t("previous")}
        title={t("previous")}
        disabled={disabled || page === 0}
        onClick={() => onChange(page - 1)}
        className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-[8px] px-2 hover:bg-track disabled:opacity-40 ${showLabels ? "" : "w-11"}`}
      >
        <ChevronLeft size={16} />
        {showLabels && <span>{t("previous")}</span>}
      </button>
      <span aria-live="polite" className="whitespace-nowrap tabular-nums">
        {Math.min(page * pageSize + 1, count)}–{Math.min((page + 1) * pageSize, count)} / {count}
      </span>
      <button
        type="button"
        aria-label={t("next")}
        title={t("next")}
        disabled={disabled || (page + 1) * pageSize >= count}
        onClick={() => onChange(page + 1)}
        className={`flex h-11 min-w-11 items-center justify-center gap-1 rounded-[8px] px-2 hover:bg-track disabled:opacity-40 ${showLabels ? "" : "w-11"}`}
      >
        {showLabels && <span>{t("next")}</span>}
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
