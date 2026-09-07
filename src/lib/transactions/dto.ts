import type { BusinessRow, CategoryRow, IncomeSourceRow, TransactionRow } from "@/db/schema";
import type { Category, Transaction } from "@/lib/types";

/** Map DB rows to app-facing shapes, computing derived display fields. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today" | "Yesterday" | "Jun 12" relative to `now`. */
export function dateLabel(occurredAt: Date, now = new Date()): string {
  const startOf = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const days = Math.round((startOf(now) - startOf(occurredAt)) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return occurredAt.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function toCategory(row: CategoryRow, spentCents: number): Category {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    monthlyBudgetCents: row.monthlyBudgetCents,
    budgetGroup:
      row.budgetGroup === "fixed" || row.budgetGroup === "flexible" ? row.budgetGroup : null,
    spentCents,
  };
}

export function toTransaction(
  row: TransactionRow,
  category: CategoryRow | null,
  incomeSource: IncomeSourceRow | null = null,
  business: BusinessRow | null = null,
  now = new Date(),
): Transaction {
  // Existing positive rows predate transaction kinds, so retain their income
  // behaviour unless a user explicitly marks the row as a reimbursement.
  const isIncome = row.amountCents > 0 && row.kind !== "reimbursement";
  return {
    id: row.id,
    merchant: row.merchant,
    emoji: category?.emoji ?? (isIncome ? "💰" : "🧾"),
    categoryId: row.categoryId,
    kind:
      row.kind === "income" ||
      row.kind === "reimbursement" ||
      row.kind === "transfer" ||
      row.kind === "payment"
        ? row.kind
        : "expense",
    recurringItemId: row.recurringItemId,
    categoryName: category?.name ?? (isIncome ? "Income" : "Uncategorized"),
    incomeSourceId: row.incomeSourceId,
    incomeSourceName: incomeSource?.name ?? null,
    businessId: row.businessId,
    businessName: business?.name ?? null,
    businessEmoji: business?.emoji ?? null,
    businessColor: business?.color ?? null,
    amountCents: row.amountCents,
    note: row.note,
    method: row.method,
    status: row.status === "pending" ? "pending" : "posted",
    dateLabel: dateLabel(new Date(row.occurredAt), now),
    occurredAt: new Date(row.occurredAt).toISOString(),
    isIncome,
    excludeFromBudget: row.excludeFromBudget,
    roundupSwept: row.roundupSweptAt !== null,
  };
}
