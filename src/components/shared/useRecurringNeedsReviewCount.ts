"use client";

import { useMemo } from "react";
import { currentNeedsReviewCount } from "@/lib/recurring/reconcile";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Current actionable recurring-review count for navigation surfaces. The
 *  transaction payload arrives after the summary, so suppress the badge until
 *  reconciliation has real data instead of briefly showing false alerts. */
export function useRecurringNeedsReviewCount(): number {
  const { recurring, transactions, transactionsLoading } = useStore(
    useShallow((state) => ({
      recurring: state.recurring,
      transactions: state.transactions,
      transactionsLoading: state.transactionsLoading,
    })),
  );
  return useMemo(
    () => (transactionsLoading ? 0 : currentNeedsReviewCount(recurring, transactions)),
    [recurring, transactions, transactionsLoading],
  );
}
