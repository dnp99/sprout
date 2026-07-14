import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatMoney } from "@/lib/format";
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
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <ProgressCard
          label="Income"
          completedLabel="received"
          progress={summary.income}
          positive
          compact={compact}
        />
        <ProgressCard
          label="Expenses"
          completedLabel="paid"
          progress={summary.expenses}
          compact={compact}
        />
      </div>
      <p className={`mt-3 ${compact ? "text-[10.5px]" : "text-[11.5px]"} font-medium text-muted`}>
        Derived from your transactions this month.
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
        {formatMoney(progress.completedCents)}
      </div>
      <div className={`mt-0.5 ${compact ? "text-[10px]" : "text-[11px]"} font-medium text-muted`}>
        {completedLabel} · {formatMoney(progress.remainingCents)} remaining
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
