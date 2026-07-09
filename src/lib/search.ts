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
export const TXN_TYPE_CHIPS: { value: TxnFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "expense", label: "💸 Expenses" },
  { value: "income", label: "💰 Income" },
  { value: "uncategorized", label: "🏷️ Uncategorized" },
  { value: "excluded", label: "🚫 Excluded" },
];

/** Filters that span the whole backlog, so they ignore the selected month. */
export const ALL_MONTHS_FILTERS = new Set<TxnFilter>(["uncategorized", "excluded"]);

interface FilterOptions {
  query?: string;
  type?: TxnFilter;
  categoryId?: string | null;
  /** "2026-06" — restrict to one month. Omit for all months. */
  monthKey?: string;
}

/** Filter transactions by free-text query, income/expense type, category, and
 *  month. Shared by the mobile Search screen and the web Transactions table. */
export function filterTransactions(
  transactions: Transaction[],
  { query = "", type = "all", categoryId = null, monthKey }: FilterOptions,
): Transaction[] {
  const q = query.toLowerCase().trim();
  return transactions.filter((t) => {
    if (monthKey && monthKeyOf(t.occurredAt) !== monthKey) return false;
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
    if (categoryId && categoryId !== "all") {
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
      av = a.amountCents;
      bv = b.amountCents;
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
