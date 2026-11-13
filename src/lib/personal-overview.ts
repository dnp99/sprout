import { localCalendarDate } from "./calendar";
import { monthTotals } from "./trends";
import type { BudgetSummary, Transaction } from "./types";

/** The API summary remains authoritative for the current month. Browsing another
 * month reuses existing ledger totals and the current pool, matching Budget's
 * month-aware view; the app does not store historical Personal budget snapshots. */
export function personalOverviewSummary(
  current: BudgetSummary,
  transactions: Transaction[],
  month: string,
  now = new Date(),
): { summary: BudgetSummary; live: boolean } {
  if (month === localCalendarDate(now).slice(0, 7)) return { summary: current, live: true };
  const { spentCents, incomeCents } = monthTotals(transactions, month);
  return {
    live: false,
    summary: {
      ...current,
      spentCents,
      incomeCents,
      savedCents: incomeCents - spentCents,
      safeToSpendCents: Math.max(0, current.budgetCents - spentCents),
      daysLeft: 0,
      monthLabel: month,
    },
  };
}
