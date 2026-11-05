import { filterTransactions, type FilterOptions } from "@/lib/search";
import type { Transaction } from "@/lib/types";

export type TransactionScope = "all" | "expense" | "income";

/** Apply primary kind first, then intersect every secondary filter. Keep the
 * existing reimbursement/income distinction rather than reclassifying money. */
export function filterScopedTransactions(
  rows: Transaction[],
  scope: TransactionScope,
  filters: FilterOptions,
) {
  return filterTransactions(
    scope === "all" ? rows : filterTransactions(rows, { type: scope }),
    filters,
  );
}

/** A visible ledger month must constrain ordinary Personal rows and totals.
 * Business custom periods deliberately supply their own date bounds instead. */
export function ledgerMonthScope(
  month: string,
  businessId: string,
  period: string,
  explicitDates = false,
) {
  return !explicitDates && (businessId === "all" || period === "month") ? month : undefined;
}
