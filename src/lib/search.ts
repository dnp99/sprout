import { formatMoney } from "./format";
import { monthKeyOf } from "./trends";
import type { Transaction, TxnFilter } from "./types";

export type SortKey = "merchant" | "category" | "date" | "amount";
export type SortDir = "asc" | "desc";

/** Friendly, mobile-facing sort presets over the (key, dir) pairs above. */
export type TxnSort = "newest" | "oldest" | "highest" | "lowest";
export const TXN_SORTS: { value: TxnSort; label: string; key: SortKey; dir: SortDir }[] = [
  { value: "newest", label: "Newest", key: "date", dir: "desc" },
  { value: "oldest", label: "Oldest", key: "date", dir: "asc" },
  { value: "highest", label: "Highest", key: "amount", dir: "desc" },
  { value: "lowest", label: "Lowest", key: "amount", dir: "asc" },
];

/** The transaction type-filter chips, shared by the web table + mobile screens. */
// `labelKey` points into the `txns` catalog namespace (plan 013).
export const TXN_TYPE_CHIPS: { value: TxnFilter; labelKey: string }[] = [
  { value: "all", labelKey: "chipAll" },
  { value: "expense", labelKey: "chipExpense" },
  { value: "income", labelKey: "chipIncome" },
  { value: "uncategorized", labelKey: "chipUncategorized" },
  { value: "excluded", labelKey: "chipExcluded" },
];

/** Filters that span the whole backlog, so they ignore the selected month. */
export const ALL_MONTHS_FILTERS = new Set<TxnFilter>(["uncategorized", "excluded"]);

/** UI-only pseudo-id for income rows that have not yet been assigned a source. */
export const UNASSIGNED_INCOME_SOURCE = "__unassigned_income_source__";

/** Web table month scope: an active free-text search spans the full loaded
 * history; without a query, ordinary filters stay on the selected month while
 * backlog filters remain all-month views. */
export function webTransactionMonthKey(
  query: string,
  type: TxnFilter,
  selectedMonthKey: string,
): string | undefined {
  return query.trim() || ALL_MONTHS_FILTERS.has(type) ? undefined : selectedMonthKey;
}

export interface FilterOptions {
  query?: string;
  type?: TxnFilter;
  categoryId?: string | null;
  /** Multiple category ids are ORed together; "income" remains a pseudo-id. */
  categoryIds?: string[];
  /** Restrict positive transactions to one source; the pseudo-id above means no source. */
  incomeSourceId?: string;
  /** "2026-06" — restrict to one month. Omit for all months. */
  monthKey?: string;
  /** Inclusive ISO date bounds (YYYY-MM-DD). An explicit range overrides month. */
  dateFrom?: string;
  dateTo?: string;
  /** Inclusive amount **magnitude** bounds in cents (a −$50 expense has |5000|). */
  amountMin?: number | null;
  amountMax?: number | null;
}

/** True when any advanced (popover) filter is set — used to badge the control
 *  and to let a date range override the month scope. */
export function hasAdvancedFilters(
  o: Pick<FilterOptions, "dateFrom" | "dateTo" | "amountMin" | "amountMax">,
): boolean {
  return Boolean(o.dateFrom || o.dateTo || o.amountMin != null || o.amountMax != null);
}

/** Filter transactions by free-text query, income/expense type, category, month,
 *  and (advanced) date range + amount range. Shared by the mobile Search screen
 *  and the web Transactions table. */
export function filterTransactions(
  transactions: Transaction[],
  {
    query = "",
    type = "all",
    categoryId = null,
    categoryIds,
    incomeSourceId,
    monthKey,
    dateFrom,
    dateTo,
    amountMin = null,
    amountMax = null,
  }: FilterOptions,
): Transaction[] {
  const q = query.toLowerCase().trim();
  return transactions.filter((t) => {
    const date = t.occurredAt.slice(0, 10); // YYYY-MM-DD
    if (monthKey && monthKeyOf(t.occurredAt) !== monthKey) return false;
    if (dateFrom && date < dateFrom) return false;
    if (dateTo && date > dateTo) return false;
    const magnitude = Math.abs(t.amountCents);
    if (amountMin != null && magnitude < amountMin) return false;
    if (amountMax != null && magnitude > amountMax) return false;
    if (q && !(t.merchant.toLowerCase().includes(q) || t.categoryName.toLowerCase().includes(q)))
      return false;
    if (type === "expense" && t.isIncome) return false;
    if (type === "income" && !t.isIncome) return false;
    // Uncategorized = an expense with no category assigned (import leaves these
    // for a manual pass). Income has no category by design, so it's excluded.
    if (type === "uncategorized" && (t.isIncome || t.categoryId !== null)) return false;
    // Excluded = internal moves kept out of budget math (transfers, card/loan
    // payments) — the only view that surfaces just those.
    if (type === "excluded" && !t.excludeFromBudget) return false;
    if (incomeSourceId) {
      if (!t.isIncome) return false;
      if (
        incomeSourceId === UNASSIGNED_INCOME_SOURCE
          ? t.incomeSourceId !== null
          : t.incomeSourceId !== incomeSourceId
      )
        return false;
    }
    const selectedCategories = categoryIds?.filter((id) => id && id !== "all") ?? [];
    if (selectedCategories.length > 0) {
      const matches = selectedCategories.some((id) =>
        id === "income" ? t.isIncome : t.categoryId === id,
      );
      if (!matches) return false;
    } else if (categoryId && categoryId !== "all") {
      if (categoryId === "income") return t.isIncome;
      if (t.categoryId !== categoryId) return false;
    }
    return true;
  });
}

export function sortTransactions(
  transactions: Transaction[],
  key: SortKey,
  dir: SortDir,
): Transaction[] {
  const factor = dir === "asc" ? 1 : -1;
  return [...transactions].sort((a, b) => {
    let av: number | string;
    let bv: number | string;
    if (key === "amount") {
      // By magnitude (size), so a −$6,000 expense outranks +$5,000 income —
      // "biggest transaction first" matches what Highest/Lowest imply.
      av = Math.abs(a.amountCents);
      bv = Math.abs(b.amountCents);
    } else if (key === "merchant") {
      av = a.merchant.toLowerCase();
      bv = b.merchant.toLowerCase();
    } else if (key === "category") {
      av = a.categoryName.toLowerCase();
      bv = b.categoryName.toLowerCase();
    } else {
      // ISO timestamps compare lexicographically — works across months, which
      // matters for all-month lists like the uncategorized review.
      av = a.occurredAt;
      bv = b.occurredAt;
    }
    if (av < bv) return -1 * factor;
    if (av > bv) return 1 * factor;
    return 0;
  });
}

/** "18 found · −$1,240" style summary of a result set. */
export function summarizeResults(transactions: Transaction[]): string {
  const total = transactions.reduce((sum, t) => sum + t.amountCents, 0);
  return `${transactions.length} found · ${formatMoney(total, { signed: true })}`;
}
