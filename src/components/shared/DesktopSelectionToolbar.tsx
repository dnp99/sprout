"use client";
import type { ReactNode } from "react";
import { Check, MoreHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SelectionStatus } from "./SelectionStatus";

export const selectionTriggerClass =
  "flex h-9 items-center gap-1.5 rounded-[8px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track disabled:cursor-not-allowed disabled:opacity-45";

/** Both ledgers share the header chrome; domain actions remain with adapters. */
export function DesktopSelectionToolbar({
  count,
  hidden = 0,
  disabled,
  onClear,
  children,
}: {
  count: number;
  hidden?: number;
  disabled?: boolean;
  onClear: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("txns");
  return (
    <section
      aria-label={t("bulkActions")}
      className="desktop-selection-toolbar relative flex min-h-9 w-full flex-wrap items-center gap-2"
    >
      <span className="flex h-9 items-center gap-1.5 px-2 text-[13px] font-semibold text-ink">
        <Check size={14} className="text-primary" />
        <SelectionStatus count={count} hidden={hidden} />
      </span>
      {children}
      <button
        type="button"
        onClick={onClear}
        disabled={disabled}
        aria-label={t("clearSelection")}
        title={t("clearSelection")}
        className="ml-auto flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium text-muted hover:bg-track hover:text-ink disabled:cursor-not-allowed disabled:opacity-45"
      >
        <X size={14} />
        {t("clear")}
      </button>
    </section>
  );
}

export function SelectionMoreButton({
  onClick,
  disabled,
  expanded,
  dialog = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  expanded: boolean;
  dialog?: boolean;
}) {
  const t = useTranslations("txns");
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup={dialog ? "dialog" : undefined}
      className={selectionTriggerClass}
    >
      <MoreHorizontal size={16} />
      {t("more")}
    </button>
  );
}
