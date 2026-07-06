import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, transactions } from "@/db/schema";
import { normalizeMerchant, saveMerchantRules } from "@/lib/import/merchant-rules";
import type { BudgetSummary, Category, Transaction } from "@/lib/types";
import type { ExportRow } from "@/lib/export";
import { toCategory, toTransaction } from "./dto";
import type { CreateTransactionInput, UpdateTransactionInput } from "./validation";

/**
 * Data access for transactions, categories and the budget summary, against the
 * Neon-backed schema. Spent/summary math excludes internal moves
 * (`exclude_from_budget`).
 */

function startOfMonth(now = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function daysLeftInMonth(now = new Date()): number {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, end.getDate() - now.getDate());
}

export async function listCategories(userId: string): Promise<Category[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(categories.sortOrder);

  const spentByCategory = await db
    .select({
      categoryId: transactions.categoryId,
      spent: sql<number>`coalesce(sum(case when ${transactions.amountCents} < 0 then -${transactions.amountCents} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.excludeFromBudget, false),
        gte(transactions.occurredAt, startOfMonth()),
      ),
    )
    .groupBy(transactions.categoryId);

  const spentMap = new Map(spentByCategory.map((r) => [r.categoryId, Number(r.spent)]));
  return rows.map((row) => toCategory(row, spentMap.get(row.id) ?? 0));
}

export async function listRecentTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  const db = getDb();
  const rows = await db
    .select({ txn: transactions, category: categories })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);

  return rows.map(({ txn, category }) => toTransaction(txn, category ?? null));
}

/** All of a user's transactions from `start` (inclusive), or all if null, as
 *  flat export rows ordered newest-first. */
export async function listTransactionsForExport(
  userId: string,
  start: Date | null,
): Promise<ExportRow[]> {
  const db = getDb();
  const where = start
    ? and(eq(transactions.userId, userId), gte(transactions.occurredAt, start))
    : eq(transactions.userId, userId);
  const rows = await db
    .select({ txn: transactions, category: categories })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(desc(transactions.occurredAt));

  return rows.map(({ txn, category }) => ({
    date: new Date(txn.occurredAt).toISOString().slice(0, 10),
    merchant: txn.merchant,
    category: category?.name ?? (txn.amountCents > 0 ? "Income" : "Uncategorized"),
    amountCents: txn.amountCents,
  }));
}

export async function createTransaction(
  userId: string,
  input: CreateTransactionInput,
): Promise<Transaction> {
  const db = getDb();
  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      merchant: input.merchant,
      amountCents: input.amountCents,
      categoryId: input.categoryId ?? null,
      note: input.note ?? null,
      method: input.method ?? "card",
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
    })
    .returning();

  const category = row.categoryId
    ? ((await db.select().from(categories).where(eq(categories.id, row.categoryId)))[0] ?? null)
    : null;
  return toTransaction(row, category);
}

/** Update an editable transaction, scoped to the owner. Returns null if the id
 *  isn't the user's. Re-derives category for the returned DTO. */
export async function updateTransaction(
  userId: string,
  id: string,
  input: UpdateTransactionInput,
): Promise<Transaction | null> {
  const db = getDb();
  const [row] = await db
    .update(transactions)
    .set({
      merchant: input.merchant,
      amountCents: input.amountCents,
      categoryId: input.categoryId,
      note: input.note,
      excludeFromBudget: input.excludeFromBudget,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  if (!row) return null;

  const category = row.categoryId
    ? ((await db.select().from(categories).where(eq(categories.id, row.categoryId)))[0] ?? null)
    : null;
  return toTransaction(row, category);
}

/** Apply a category to every transaction from the same merchant (matched by the
 *  normalized merchant key, so store numbers/formatting don't split it) and
 *  cache it as a **manual** merchant rule so future imports + backlog runs
 *  auto-apply it. Owner-scoped. Returns the number of rows updated (including
 *  the one just edited). */
export async function applyCategoryToMerchant(
  userId: string,
  merchant: string,
  categoryId: string,
): Promise<number> {
  const pattern = normalizeMerchant(merchant);
  if (!pattern) return 0;

  const db = getDb();
  const rows = await db
    .select({ id: transactions.id, merchant: transactions.merchant })
    .from(transactions)
    .where(eq(transactions.userId, userId));
  const ids = rows.filter((r) => normalizeMerchant(r.merchant) === pattern).map((r) => r.id);
  if (ids.length === 0) return 0;

  await db
    .update(transactions)
    .set({ categoryId, updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)));
  // A manual rule wins over an AI one for the same pattern (upsert on user+pattern).
  await saveMerchantRules(userId, [{ pattern, categoryId, source: "manual" }]);
  return ids.length;
}

/** Delete a transaction, scoped to the owner. Returns false if not found. */
export async function deleteTransaction(userId: string, id: string): Promise<boolean> {
  const db = getDb();
  const deleted = await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning({ id: transactions.id });
  return deleted.length > 0;
}

export async function getBudgetSummary(userId: string): Promise<BudgetSummary> {
  const db = getDb();

  const [budgetRow] = await db
    .select({
      budget: sql<number>`coalesce(sum(${categories.monthlyBudgetCents}), 0)`,
    })
    .from(categories)
    .where(eq(categories.userId, userId));

  const [flowRow] = await db
    .select({
      spent: sql<number>`coalesce(sum(case when ${transactions.amountCents} < 0 then -${transactions.amountCents} else 0 end), 0)`,
      income: sql<number>`coalesce(sum(case when ${transactions.amountCents} > 0 then ${transactions.amountCents} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.excludeFromBudget, false),
        gte(transactions.occurredAt, startOfMonth()),
      ),
    );

  const budgetCents = Number(budgetRow?.budget ?? 0);
  const spentCents = Number(flowRow?.spent ?? 0);
  const incomeCents = Number(flowRow?.income ?? 0);
  const now = new Date();

  return {
    budgetCents,
    spentCents,
    incomeCents,
    safeToSpendCents: Math.max(0, budgetCents - spentCents),
    savedCents: Math.max(0, incomeCents - spentCents),
    daysLeft: daysLeftInMonth(now),
    monthLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}
