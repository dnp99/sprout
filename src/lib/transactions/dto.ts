import type { CategoryRow, TransactionRow } from "@/db/schema";
import type { Category, Transaction } from "@/lib/types";

/** Map DB rows to app-facing shapes, computing derived display fields. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today" | "Yesterday" | "Jun 12" relative to `now`. */
export function dateLabel(occurredAt: Date, now = new Date()): string {
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOf(now) - startOf(occurredAt)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return occurredAt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function toCategory(row: CategoryRow, spentCents: number): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    monthlyBudgetCents: row.monthlyBudgetCents,
    spentCents,
  };
}

export function toTransaction(
  row: TransactionRow,
  category: CategoryRow | null,
  now = new Date(),
): Transaction {
  const isIncome = row.amountCents > 0;
  return {
    id: row.id,
    merchant: row.merchant,
    emoji: category?.emoji ?? (isIncome ? "💰" : "🧾"),
    categoryId: row.categoryId,
    categoryName: category?.name ?? (isIncome ? "Income" : "Uncategorized"),
    amountCents: row.amountCents,
    note: row.note,
    method: row.method,
    status: row.status === "pending" ? "pending" : "posted",
    dateLabel: dateLabel(new Date(row.occurredAt), now),
    occurredAt: new Date(row.occurredAt).toISOString(),
    isIncome,
    excludeFromBudget: row.excludeFromBudget,
  };
}
