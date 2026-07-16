"use client";

import { Check, ChevronRight, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { RecurringCompletionButton } from "@/components/shared/RecurringCompletionButton";
import { RecurringMonthlyProgress } from "@/components/shared/RecurringMonthlyProgress";
import {
  useRecurringFrequencyLabel,
  useRelativeDueLabel,
} from "@/components/shared/useRecurringLabels";
import { useFormatters } from "@/i18n/useFormatters";
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
  onMarkPaid?: (row: RecurringMonthRow) => void;
  markingOccurrenceId?: string | null;
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
  onMarkPaid,
  markingOccurrenceId = null,
}: MonthlyRecurringViewProps) {
  const t = useTranslations("bills");
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
          {t("checking")}
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
        <div className="text-[14px] font-semibold text-ink">{t("noActiveTitle")}</div>
        <p className="mt-1 text-[12px] font-medium text-muted">{t("noActiveBody")}</p>
      </div>
    );
  }

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
  return (
    <div>
      <RecurringMonthlyProgress summary={summary} compact={compact} />

      <div className={compact ? "mt-3 space-y-3" : "mt-4 space-y-4"}>
        <RecurringSection
          title={t("upcoming")}
          monthKey={summary.monthKey}
          rows={summary.upcoming}
          categoryNames={categoryNames}
          compact={compact}
          onEdit={onEdit}
          onMarkPaid={onMarkPaid}
          markingOccurrenceId={markingOccurrenceId}
        />
        <RecurringSection
          title={t("complete")}
          monthKey={summary.monthKey}
          rows={summary.complete}
          categoryNames={categoryNames}
          compact={compact}
          onEdit={onEdit}
          onMarkPaid={onMarkPaid}
          markingOccurrenceId={markingOccurrenceId}
        />
        <div ref={needsReviewRef}>
          <RecurringSection
            title={t("needsReview")}
            monthKey={summary.monthKey}
            rows={summary.unmatched}
            categoryNames={categoryNames}
            compact={compact}
            onEdit={onEdit}
            onMarkPaid={onMarkPaid}
            markingOccurrenceId={markingOccurrenceId}
          />
        </div>
      </div>
    </div>
  );
}

function RecurringSection({
  title,
  monthKey,
  rows,
  categoryNames,
  compact,
  onEdit,
  onMarkPaid,
  markingOccurrenceId,
}: {
  title: string;
  monthKey: string;
  rows: RecurringMonthRow[];
  categoryNames: Map<string, string>;
  compact: boolean;
  onEdit?: (recurringId: string) => void;
  onMarkPaid?: (row: RecurringMonthRow) => void;
  markingOccurrenceId: string | null;
}) {
  const t = useTranslations("bills");
  const fmt = useFormatters();
  if (rows.length === 0) return null;
  const income = rows.filter((row) => row.isIncome).reduce((sum, row) => sum + row.amountCents, 0);
  const expenses = rows
    .filter((row) => !row.isIncome)
    .reduce((sum, row) => sum + row.amountCents, 0);
  const values = [];
  if (income > 0) values.push(t("sectionIncome", { amount: fmt.money(income, { signed: true }) }));
  if (expenses > 0) values.push(t("sectionExpenses", { amount: fmt.money(expenses) }));
  const totals = values.join(" · ");
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
            monthKey={monthKey}
            categoryName={row.categoryId ? categoryNames.get(row.categoryId) : undefined}
            compact={compact}
            onEdit={onEdit}
            onMarkPaid={onMarkPaid}
            marking={markingOccurrenceId === row.occurrenceId}
          />
        ))}
      </div>
    </section>
  );
}

function RecurringMonthRowView({
  row,
  monthKey,
  categoryName,
  compact,
  onEdit,
  onMarkPaid,
  marking,
}: {
  row: RecurringMonthRow;
  monthKey: string;
  categoryName?: string;
  compact: boolean;
  onEdit?: (recurringId: string) => void;
  onMarkPaid?: (row: RecurringMonthRow) => void;
  marking: boolean;
}) {
  const t = useTranslations("bills");
  const fmt = useFormatters();
  const frequencyLabel = useRecurringFrequencyLabel();
  const relativeDueLabel = useRelativeDueLabel(monthKey);
  const relative = relativeDueLabel(row.dueDate);
  const statusLabel =
    row.status === "complete"
      ? t(row.isIncome ? "status.receivedRel" : "status.paidRel", { relative })
      : row.status === "unmatched"
        ? t("status.noMatchRel", { relative })
        : t("status.dueRel", { relative });
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
          {frequencyLabel(row)} ·{" "}
          {categoryName ?? (row.isIncome ? t("income") : t("uncategorized"))}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div
          className={`${compact ? "text-[12px]" : "text-[13.5px]"} font-semibold tabular-nums ${row.isIncome ? "text-green" : "text-ink"}`}
        >
          {fmt.money(row.amountCents, { signed: row.isIncome })}
        </div>
        <div
          className={`mt-0.5 flex items-center justify-end gap-1 ${compact ? "text-[9.5px]" : "text-[10.5px]"} font-medium ${statusTone(row.status)}`}
        >
          <StatusIcon status={row.status} compact={compact} />
          {statusLabel}
        </div>
      </div>
      {onEdit && (
        <ChevronRight size={compact ? 14 : 16} strokeWidth={2} className="shrink-0 text-muted" />
      )}
    </>
  );

  const rowClassName = `flex min-w-0 flex-1 items-center text-left ${
    compact ? "gap-2.5 px-3 py-2.5" : "gap-3 px-4 py-3"
  }`;
  const showCompletionAction = row.status === "unmatched" && onMarkPaid;
  const action = (
    <RecurringCompletionButton
      row={row}
      compact={compact}
      marking={marking}
      onMarkPaid={onMarkPaid}
    />
  );
  return (
    <div className="flex items-center border-b border-edge last:border-b-0">
      {onEdit ? (
        <button type="button" onClick={() => onEdit(row.recurringId)} className={rowClassName}>
          {content}
        </button>
      ) : (
        <div className={rowClassName}>{content}</div>
      )}
      {showCompletionAction && <div className={compact ? "pr-2" : "pr-3"}>{action}</div>}
    </div>
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
