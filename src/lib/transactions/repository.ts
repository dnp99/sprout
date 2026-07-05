import { and, desc, eq, gte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, transactions } from "@/db/schema";
import type { BudgetSummary, Category, Transaction } from "@/lib/types";
import { toCategory, toTransaction } from "./dto";
import type { CreateTransactionInput } from "./validation";

/**
 * Data access for transactions, categories and the budget summary.
 *
 * Not exercised until Neon is connected (the app runs on the client store /
 * mock data this pass), but written against the real schema so the API routes
 * work the moment DATABASE_URL is set.
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
    .where(and(eq(transactions.userId, userId), gte(transactions.occurredAt, startOfMonth())))
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
    .where(and(eq(transactions.userId, userId), gte(transactions.occurredAt, startOfMonth())));

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
