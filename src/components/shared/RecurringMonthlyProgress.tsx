"use client";

import { useTranslations } from "next-intl";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useFormatters } from "@/i18n/useFormatters";
import type { RecurringMonthProgress, RecurringMonthSummary } from "@/lib/recurring/reconcile";

/** Income and expense progress is shared by the list and calendar renderers so
 *  changing the Monthly view mode never changes the user's cash-flow context. */
export function RecurringMonthlyProgress({
  summary,
  compact = false,
}: {
  summary: RecurringMonthSummary;
  compact?: boolean;
}) {
  const t = useTranslations("bills.progress");
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <ProgressCard
          label={t("income")}
          completedLabel={t("received")}
          progress={summary.income}
          positive
          compact={compact}
        />
        <ProgressCard
          label={t("expenses")}
          completedLabel={t("paid")}
          progress={summary.expenses}
          compact={compact}
        />
      </div>
      <p className={`mt-3 ${compact ? "text-[10.5px]" : "text-[11.5px]"} font-medium text-muted`}>
        {t("derived")}
      </p>
    </>
  );
}

function ProgressCard({
  label,
  completedLabel,
  progress,
  positive = false,
  compact,
}: {
  label: string;
  completedLabel: string;
  progress: RecurringMonthProgress;
  positive?: boolean;
  compact: boolean;
}) {
  const t = useTranslations("bills.progress");
  const fmt = useFormatters();
  const percent =
    progress.totalCents === 0 ? 0 : (progress.completedCents / progress.totalCents) * 100;
  return (
    <section
      className={`border border-edge ${compact ? "rounded-[10px] p-3" : "rounded-[14px] p-4"}`}
    >
      <div
        className={`${compact ? "text-[9.5px]" : "text-[10.5px]"} font-semibold uppercase tracking-[.05em] text-muted`}
      >
        {label}
      </div>
      <div
        className={`mt-1 ${compact ? "text-[18px]" : "text-[22px]"} font-bold tracking-[-.025em] tabular-nums ${positive ? "text-green" : "text-ink"}`}
      >
        {fmt.money(progress.completedCents)}
      </div>
      <div className={`mt-0.5 ${compact ? "text-[10px]" : "text-[11px]"} font-medium text-muted`}>
        {completedLabel} · {t("remaining", { amount: fmt.money(progress.remainingCents) })}
      </div>
      <ProgressBar
        percent={percent}
        color={positive ? "var(--pos)" : "var(--primary)"}
        height={compact ? 5 : 6}
        className="mt-3"
      />
    </section>
  );
}
