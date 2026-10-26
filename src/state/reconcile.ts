import type { AppState } from "./types";
import type { SummaryData } from "@/lib/api";
import type { Transaction } from "@/lib/types";

/** Phase 1: merge the summary payload (everything but transactions) and paint
 *  the shell. Seeds webBudgets from category budgets on the first load only (so
 *  later refetches don't wipe in-progress budget edits). Flags transactions as
 *  loading only when we don't already have them (so a refresh keeps stale rows
 *  on screen instead of flashing skeletons). */
export function withSummary(prev: AppState, data: SummaryData): Partial<AppState> {
  return {
    user: data.user,
    categories: data.categories,
    summary: data.summary,
    goals: data.goals,
    recurring: data.recurring,
    incomeSources: data.incomeSources,
    businesses: data.businesses,
    loaded: true,
    loadError: false,
    transactionsLoading: prev.transactions.length === 0,
    selectedCategoryId: prev.selectedCategoryId || data.categories[0]?.id || "",
    addCategoryId: data.categories.some((c) => c.id === prev.addCategoryId)
      ? prev.addCategoryId
      : (data.categories.find((c) => c.id !== "bills")?.id ?? prev.addCategoryId),
    webBudgets: prev.loaded
      ? prev.webBudgets
      : Object.fromEntries(data.categories.map((c) => [c.id, c.monthlyBudgetCents])),
  };
}

/** Phase 2: merge the transaction set once it arrives. */
export function withTransactions(prev: AppState, transactions: Transaction[]): Partial<AppState> {
  return {
    transactions,
    transactionsLoading: false,
    selectedTxnId: prev.selectedTxnId || transactions[0]?.id || "",
  };
}
