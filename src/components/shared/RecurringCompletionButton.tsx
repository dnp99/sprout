"use client";

import type { RecurringMonthRow } from "@/lib/recurring/reconcile";

interface RecurringCompletionButtonProps {
  row: RecurringMonthRow;
  compact: boolean;
  marking: boolean;
  onMarkPaid?: (row: RecurringMonthRow) => void;
}

/** The action is available only for past-due, unmatched occurrences. It creates
 *  a standard linked transaction, rather than a separate paid-state record. */
export function RecurringCompletionButton({
  row,
  compact,
  marking,
  onMarkPaid,
}: RecurringCompletionButtonProps) {
  if (row.status !== "unmatched" || !onMarkPaid) return null;
  const label = row.isIncome ? "Mark received" : "Mark paid";
  return (
    <button
      type="button"
      disabled={marking}
      onClick={() => onMarkPaid(row)}
      title={`${label}: creates a linked transaction on ${row.dueDate}`}
      className={`shrink-0 rounded border border-edge font-semibold text-primary transition hover:bg-primary-soft disabled:cursor-wait disabled:opacity-60 ${
        compact ? "px-2 py-1 text-[9.5px]" : "px-2.5 py-1.5 text-[10.5px]"
      }`}
    >
      {marking ? "Saving…" : label}
    </button>
  );
}
