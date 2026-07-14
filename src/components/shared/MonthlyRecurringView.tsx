"use client";

import { Check, ChevronRight, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { RecurringMonthlyProgress } from "@/components/shared/RecurringMonthlyProgress";
import { formatMoney } from "@/lib/format";
import type {
  RecurringMonthRow,
  RecurringMonthStatus,
  RecurringMonthSummary,
} from "@/lib/recurring/reconcile";
import type { Category } from "@/lib/types";

interface MonthlyRecurringViewProps {
  summary: RecurringMonthSummary;
  categories: Category[];
  loading: boolean;
  compact?: boolean;
  /** Used by the Bills navigation badge to land on the actionable section. */
  focusNeedsReview?: boolean;
  onEdit?: (recurringId: string) => void;
}

/** Shared month-status presentation for Bills on desktop and mobile. The
 *  reconciliation library owns all status and total decisions; this component
 *  only turns that stable view model into responsive UI. */
export function MonthlyRecurringView({
  summary,
  categories,
  loading,
  compact = false,
  focusNeedsReview = false,
  onEdit,
}: MonthlyRecurringViewProps) {
  const needsReviewRef = useRef<HTMLDivElement>(null);
  const hasNeedsReview = summary.unmatched.length > 0;
  const didFocusNeedsReview = useRef(false);

  useEffect(() => {
    if (!focusNeedsReview || !hasNeedsReview || didFocusNeedsReview.current) return;
    didFocusNeedsReview.current = true;
    requestAnimationFrame(() =>
      needsReviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [focusNeedsReview, hasNeedsReview]);

  if (loading) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center border border-edge ${
          compact ? "rounded-[10px]" : "rounded-[14px]"
        }`}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium text-muted">
          <LoaderCircle size={15} strokeWidth={2} className="animate-spin" />
          Checking this month&apos;s transactions…
        </div>
      </div>
    );
  }

  const hasOccurrences =
    summary.upcoming.length + summary.complete.length + summary.unmatched.length > 0;
  if (!hasOccurrences) {
    return (
      <div
        className={`border border-edge p-5 text-center ${compact ? "rounded-[10px]" : "rounded-[14px]"}`}
      >
        <div className="text-[14px] font-semibold text-ink">No active recurring items</div>
        <p className="mt-1 text-[12px] font-medium text-muted">
          Add or resume a recurring bill or income item to track it here.
        </p>
      </div>
    );
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return (
    <div>
      <RecurringMonthlyProgress summary={summary} compact={compact} />

      <div className={compact ? "mt-3 space-y-3" : "mt-4 space-y-4"}>
        <RecurringSection
          title="Upcoming"
          rows={summary.upcoming}
          categoryNames={categoryNames}
          compact={compact}
          onEdit={onEdit}
        />
        <RecurringSection
          title="Complete"
          rows={summary.complete}
          categoryNames={categoryNames}
          compact={compact}
          onEdit={onEdit}
        />
        <div ref={needsReviewRef}>
          <RecurringSection
            title="Needs review"
            rows={summary.unmatched}
            categoryNames={categoryNames}
            compact={compact}
            onEdit={onEdit}
          />
        </div>
      </div>
    </div>
  );
}

function RecurringSection({
  title,
  rows,
  categoryNames,
  compact,
  onEdit,
}: {
  title: string;
  rows: RecurringMonthRow[];
  categoryNames: Map<string, string>;
  compact: boolean;
  onEdit?: (recurringId: string) => void;
}) {
  if (rows.length === 0) return null;
  const totals = sectionTotals(rows);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className={`${compact ? "text-[12px]" : "text-[13.5px]"} font-semibold text-ink`}>
          {title}
        </div>
        <div
          className={`${compact ? "text-[10px]" : "text-[11px]"} text-right font-medium text-muted`}
        >
          {totals}
        </div>
      </div>
      <div
        className={`overflow-hidden border border-edge ${compact ? "rounded-[10px]" : "rounded-[14px]"}`}
      >
        {rows.map((row) => (
          <RecurringMonthRowView
            key={row.occurrenceId}
            row={row}
            categoryName={row.categoryId ? categoryNames.get(row.categoryId) : undefined}
            compact={compact}
            onEdit={onEdit}
          />
        ))}
      </div>
    </section>
  );
}

function RecurringMonthRowView({
  row,
  categoryName,
  compact,
  onEdit,
}: {
  row: RecurringMonthRow;
  categoryName?: string;
  compact: boolean;
  onEdit?: (recurringId: string) => void;
}) {
  const content = (
    <>
      <span className={compact ? "text-[18px]" : "text-xl"}>{row.emoji}</span>
      <div className="min-w-0 flex-1">
        <div
          className={`truncate ${compact ? "text-[12px]" : "text-[13.5px]"} font-semibold text-ink`}
        >
          {row.name}
        </div>
        <div
          className={`mt-0.5 truncate ${compact ? "text-[10px]" : "text-[11px]"} font-medium text-muted`}
        >
          {row.cadenceLabel} · {categoryName ?? (row.isIncome ? "Income" : "Uncategorized")}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={`${compact ? "text-[12px]" : "text-[13.5px]"} font-semibold tabular-nums ${row.isIncome ? "text-green" : "text-ink"}`}
        >
          {formatMoney(row.amountCents, { signed: row.isIncome })}
        </div>
        <div
          className={`mt-0.5 flex items-center justify-end gap-1 ${compact ? "text-[9.5px]" : "text-[10.5px]"} font-medium ${statusTone(row.status)}`}
        >
          <StatusIcon status={row.status} compact={compact} />
          {statusLabel(row)}
        </div>
      </div>
      {onEdit && (
        <ChevronRight size={compact ? 14 : 16} strokeWidth={2} className="shrink-0 text-muted" />
      )}
    </>
  );

  const className = `flex w-full items-center border-b border-edge text-left last:border-b-0 ${
    compact ? "gap-2.5 px-3 py-2.5" : "gap-3 px-4 py-3"
  }`;
  return onEdit ? (
    <button type="button" onClick={() => onEdit(row.recurringId)} className={className}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

function StatusIcon({ status, compact }: { status: RecurringMonthStatus; compact: boolean }) {
  const size = compact ? 11 : 12;
  if (status === "complete") return <Check size={size} strokeWidth={2.5} />;
  if (status === "unmatched") return <CircleAlert size={size} strokeWidth={2.2} />;
  return <Clock3 size={size} strokeWidth={2.2} />;
}

function statusTone(status: RecurringMonthStatus): string {
  if (status === "complete") return "text-green";
  if (status === "unmatched") return "text-primary";
  return "text-muted";
}

function statusLabel(row: RecurringMonthRow): string {
  if (row.status === "complete")
    return `${row.isIncome ? "Received" : "Paid"} · ${row.relativeLabel}`;
  if (row.status === "unmatched") return `No match · ${row.relativeLabel}`;
  return `Due ${row.relativeLabel}`;
}

function sectionTotals(rows: RecurringMonthRow[]): string {
  const income = rows.filter((row) => row.isIncome).reduce((sum, row) => sum + row.amountCents, 0);
  const expenses = rows
    .filter((row) => !row.isIncome)
    .reduce((sum, row) => sum + row.amountCents, 0);
  const values = [];
  if (income > 0) values.push(`Income ${formatMoney(income, { signed: true })}`);
  if (expenses > 0) values.push(`Expenses ${formatMoney(expenses)}`);
  return values.join(" · ");
}
