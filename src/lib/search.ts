import { formatMoney } from "./format";
import type { Transaction, TxnFilter } from "./types";

export type SortKey = "merchant" | "category" | "date" | "amount";
export type SortDir = "asc" | "desc";

interface FilterOptions {
  query?: string;
  type?: TxnFilter;
  categoryId?: string | null;
}

/** Filter transactions by free-text query, income/expense type, and category.
 *  Shared by the mobile Search screen and the web Transactions table. */
export function filterTransactions(
  transactions: Transaction[],
  { query = "", type = "all", categoryId = null }: FilterOptions,
): Transaction[] {
  const q = query.toLowerCase().trim();
  return transactions.filter((t) => {
    if (q && !(t.merchant.toLowerCase().includes(q) || t.categoryName.toLowerCase().includes(q)))
      return false;
    if (type === "expense" && t.isIncome) return false;
    if (type === "income" && !t.isIncome) return false;
    if (categoryId && categoryId !== "all") {
      if (categoryId === "income") return t.isIncome;
      if (t.categoryId !== categoryId) return false;
    }
    return true;
  });
}

/** Rank a "Today" / "Yesterday" / "Jun 12" label for date sorting. */
function dateRank(label: string): number {
  if (label === "Today") return 9999;
  if (label === "Yesterday") return 9998;
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
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
      av = dateRank(a.dateLabel);
      bv = dateRank(b.dateLabel);
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
