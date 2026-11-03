"use client";

import type { ReactNode } from "react";
import { MonthTransactionCount } from "@/components/shared/MonthTransactionCount";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";

/** Totals describe the visible selection, including explicit exclusion/refund
 * notes so moving workspace actions cannot change their accounting meaning. */
export function TransactionTotals({
  count,
  excludedCount,
  reimbursementCount,
  totalCents,
  month,
  monthlyCount,
  pagination,
}: {
  count: number;
  excludedCount: number;
  reimbursementCount: number;
  totalCents: number;
  month?: string;
  monthlyCount?: number;
  pagination?: ReactNode;
}) {
  const t = useTranslations("txns");
  const fmt = useFormatters();
  return (
    <div className="cozy-transaction-total flex shrink-0 items-center justify-between gap-4 border-t border-edge px-3 py-3">
      <span className="flex flex-col text-[12px] font-medium text-muted">
        {month && monthlyCount !== undefined && (
          <MonthTransactionCount month={month} count={monthlyCount} />
        )}
        <span>{t(month ? "matchingCount" : "summaryCount", { count })}</span>
        {excludedCount > 0 && (
          <span className="text-[11px] text-subtle">
            {t("excludedFromTotal", { count: excludedCount })}
          </span>
        )}
        {reimbursementCount > 0 && (
          <span className="text-[11px] text-subtle">
            {t("reimbursementsIncluded", { count: reimbursementCount })}
          </span>
        )}
      </span>
      {pagination}
      <span className="flex flex-col items-end">
        <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-subtle">
          {t("visibleTotal")}
        </span>
        <span
          className={`mt-0.5 text-[16px] font-bold tabular-nums ${totalCents >= 0 ? "text-green" : "text-ink"}`}
        >
          {fmt.money(totalCents, { signed: true })}
        </span>
      </span>
    </div>
  );
}
