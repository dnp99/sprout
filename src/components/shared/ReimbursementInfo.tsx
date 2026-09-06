"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";

/** Persistent context for reimbursement-specific views and entry. It is never
 * dismissible because the category/budget treatment is essential to correctly
 * interpreting this transaction type. */
export function ReimbursementInfo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("addFlow");

  return (
    <div
      role="note"
      className={`flex min-w-0 items-center gap-2.5 rounded-[12px] border border-primary/25 bg-primary-soft text-ink ${
        compact ? "min-h-11 px-3 py-2" : "h-11 px-3"
      } ${className ?? ""}`}
    >
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-card text-primary">
        <Info size={15} strokeWidth={2} aria-hidden />
      </span>
      <p className="min-w-0 text-[12px] leading-[1.35] text-muted">
        <span className="font-semibold text-ink">{t("reimbursementHelpTitle")}</span>{" "}
        {t("reimbursementHelp")}
      </p>
    </div>
  );
}
