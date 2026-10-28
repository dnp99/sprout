"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";

/** Shared entry point; each ledger shell opens its existing composer. */
export function QuickAddButton({
  onClick,
  compact = false,
  disabled = false,
}: {
  onClick: () => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("nav");
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t("addTransaction")}
      title={t("addTransaction")}
      className="quick-add-button inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-[10px] bg-primary px-3 font-semibold text-onprimary transition hover:brightness-95 disabled:opacity-40"
    >
      <Plus size={16} strokeWidth={2} />
      {!compact && <span className="text-[12.5px]">{t("addTransaction")}</span>}
    </button>
  );
}
