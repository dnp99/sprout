import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { businesses, categories, incomeSources, transactions, users } from "@/db/schema";
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

// UTC month bounds so the server buckets months the same way the client does
// (occurredAt is stored UTC) — and so "this month" has a proper upper bound.
function startOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function startOfNextMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
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
      spent: sql<number>`coalesce(sum(case when ${transactions.amountCents} < 0 then -${transactions.amountCents} when ${transactions.kind} = 'reimbursement' then -${transactions.amountCents} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.excludeFromBudget, false),
        gte(transactions.occurredAt, startOfMonth()),
        lt(transactions.occurredAt, startOfNextMonth()),
      ),
    )
    .groupBy(transactions.categoryId);

  const spentMap = new Map(spentByCategory.map((r) => [r.categoryId, Number(r.spent)]));
  return rows.map((row) => toCategory(row, spentMap.get(row.id) ?? 0));
}

export async function listRecentTransactions(userId: string, limit = 20): Promise<Transaction[]> {
  const db = getDb();
  const rows = await db
    .select({
      txn: transactions,
      category: categories,
      incomeSource: incomeSources,
      business: businesses,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(incomeSources, eq(transactions.incomeSourceId, incomeSources.id))
    .leftJoin(businesses, eq(transactions.businessId, businesses.id))
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);

  return rows.map(({ txn, category, incomeSource, business }) =>
    toTransaction(txn, category ?? null, incomeSource ?? null, business ?? null),
  );
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
      incomeSourceId: input.incomeSourceId ?? null,
      businessId: input.businessId ?? null,
      note: input.note ?? null,
      method: input.method ?? "card",
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      // Machine fields — default to a plain, budget-counted expense so in-app
      // adds are unaffected; ingest sets kind/exclude via classify + externalId
      // as its idempotency key.
      kind: input.kind ?? "expense",
      excludeFromBudget: input.excludeFromBudget ?? false,
      externalId: input.externalId ?? null,
      source: input.source ?? null,
    })
    .returning();

  const category = row.categoryId
    ? ((await db.select().from(categories).where(eq(categories.id, row.categoryId)))[0] ?? null)
    : null;
  const incomeSource = row.incomeSourceId
    ? ((await db.select().from(incomeSources).where(eq(incomeSources.id, row.incomeSourceId)))[0] ??
      null)
    : null;
  const business = row.businessId
    ? ((await db.select().from(businesses).where(eq(businesses.id, row.businessId)))[0] ?? null)
    : null;
  return toTransaction(row, category, incomeSource, business);
}

/** Find a row by its dedupe key, scoped to the owner. Lets the ingest path make
 *  a retried capture (same Idempotency-Key / MessageSid) a no-op instead of a
 *  duplicate. Returns null when there's no match. */
export async function findTransactionByExternalId(
  userId: string,
  externalId: string,
): Promise<Transaction | null> {
  const db = getDb();
  const rows = await db
    .select({ txn: transactions, category: categories })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(eq(transactions.userId, userId), eq(transactions.externalId, externalId)))
    .limit(1);
  const hit = rows[0];
  return hit ? toTransaction(hit.txn, hit.category) : null;
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
      incomeSourceId: input.incomeSourceId,
      ...(input.businessId !== undefined ? { businessId: input.businessId } : {}),
      kind: input.kind,
      note: input.note,
      excludeFromBudget: input.excludeFromBudget,
      // Only touch the date when the caller sent a new one.
      ...(input.occurredAt ? { occurredAt: new Date(input.occurredAt) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
    .returning();
  if (!row) return null;

  const category = row.categoryId
    ? ((await db.select().from(categories).where(eq(categories.id, row.categoryId)))[0] ?? null)
    : null;
  const incomeSource = row.incomeSourceId
    ? ((await db.select().from(incomeSources).where(eq(incomeSources.id, row.incomeSourceId)))[0] ??
      null)
    : null;
  const business = row.businessId
    ? ((await db.select().from(businesses).where(eq(businesses.id, row.businessId)))[0] ?? null)
    : null;
  return toTransaction(row, category, incomeSource, business);
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

/** Assign a category (or null to clear) to many transactions at once, scoped to
 *  the owner. Returns the number of rows updated. Used by bulk multi-select. */
export async function setCategoryForTransactions(
  userId: string,
  ids: string[],
  categoryId: string | null,
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .update(transactions)
    .set({ categoryId, updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)))
    .returning({ id: transactions.id });
  return rows.length;
}

/** Assign an income source (or clear it) on selected positive transactions.
 *  The amount predicate is enforced here as well as in the route so expenses
 *  cannot acquire an income-only label through a bulk request. */
export async function setIncomeSourceForTransactions(
  userId: string,
  ids: string[],
  incomeSourceId: string | null,
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .update(transactions)
    .set({ incomeSourceId, updatedAt: new Date() })
    .where(
      and(
        eq(transactions.userId, userId),
        inArray(transactions.id, ids),
        sql`${transactions.amountCents} > 0`,
      ),
    )
    .returning({ id: transactions.id });
  return rows.length;
}

/** Exclude many owned transactions from budget and cash-flow calculations without
 * changing their amount, category, or import-derived kind. This is reversible
 * through the existing transaction editor. */
export async function excludeTransactionsFromBudget(
  userId: string,
  ids: string[],
): Promise<number> {
  return setTransactionsBudgetExclusion(userId, ids, true);
}

/** Toggle budget participation for many owned transactions without changing
 * their amount, category, or import-derived kind. */
export async function setTransactionsBudgetExclusion(
  userId: string,
  ids: string[],
  excludeFromBudget: boolean,
): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .update(transactions)
    .set({ excludeFromBudget, updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)))
    .returning({ id: transactions.id });
  return rows.length;
}

/** Bulk-delete transactions, scoped to the owner. Returns how many were deleted
 *  (rows the user doesn't own are ignored). Backs the multi-select delete. */
export async function deleteTransactions(userId: string, ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const rows = await getDb()
    .delete(transactions)
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids)))
    .returning({ id: transactions.id });
  return rows.length;
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

  // The total monthly budget is the user's pool (single source of truth);
  // category budgets are allocations *within* it — see plans/007.
  const [poolRow] = await db
    .select({ pool: users.budgetPoolCents })
    .from(users)
    .where(eq(users.id, userId));

  const [allocRow] = await db
    .select({
      allocated: sql<number>`coalesce(sum(${categories.monthlyBudgetCents}), 0)`,
    })
    .from(categories)
    .where(eq(categories.userId, userId));

  const [flowRow] = await db
    .select({
      spent: sql<number>`coalesce(sum(case when ${transactions.amountCents} < 0 then -${transactions.amountCents} when ${transactions.kind} = 'reimbursement' then -${transactions.amountCents} else 0 end), 0)`,
      income: sql<number>`coalesce(sum(case when ${transactions.amountCents} > 0 and ${transactions.kind} <> 'reimbursement' then ${transactions.amountCents} else 0 end), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.excludeFromBudget, false),
        gte(transactions.occurredAt, startOfMonth()),
        lt(transactions.occurredAt, startOfNextMonth()),
      ),
    );

  const budgetCents = Number(poolRow?.pool ?? 0);
  const allocatedCents = Number(allocRow?.allocated ?? 0);
  const spentCents = Number(flowRow?.spent ?? 0);
  const incomeCents = Number(flowRow?.income ?? 0);
  const now = new Date();

  return {
    budgetCents,
    allocatedCents,
    // Can go negative when the user over-allocates the pool (shown as a warning).
    unallocatedCents: budgetCents - allocatedCents,
    spentCents,
    incomeCents,
    safeToSpendCents: Math.max(0, budgetCents - spentCents),
    // Net cash flow for the month — allowed to go negative when spending
    // exceeds income (you dipped into savings). See the Saved tile.
    savedCents: incomeCents - spentCents,
    daysLeft: daysLeftInMonth(now),
    monthLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}
