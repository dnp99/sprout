import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, recurringItems, transactions } from "@/db/schema";
import type { RecurringItem, Transaction } from "@/lib/types";
import type { RecurringInput } from "./validation";
import { toRecurringItem } from "./dto";
import { toTransaction } from "@/lib/transactions/dto";
import { recurringOccurrencesForMonth } from "./reconcile";

export class InvalidRecurringOccurrenceError extends Error {}

/** A user's recurring income + bills, ordered by day of month. */
export async function listRecurring(userId: string): Promise<RecurringItem[]> {
  const rows = await getDb()
    .select()
    .from(recurringItems)
    .where(eq(recurringItems.userId, userId))
    .orderBy(asc(recurringItems.sortOrder), asc(recurringItems.dayOfMonth));
  return rows.map(toRecurringItem);
}

export async function createRecurring(
  userId: string,
  input: RecurringInput,
): Promise<RecurringItem> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(recurringItems)
    .where(eq(recurringItems.userId, userId));
  const [row] = await db
    .insert(recurringItems)
    .values({ userId, ...input, sortOrder: Number(count) })
    .returning();
  return toRecurringItem(row);
}

export async function updateRecurring(
  userId: string,
  id: string,
  input: RecurringInput,
): Promise<RecurringItem | null> {
  const [row] = await getDb()
    .update(recurringItems)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(recurringItems.id, id), eq(recurringItems.userId, userId)))
    .returning();
  return row ? toRecurringItem(row) : null;
}

export async function deleteRecurring(userId: string, id: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(recurringItems)
    .where(and(eq(recurringItems.id, id), eq(recurringItems.userId, userId)))
    .returning({ id: recurringItems.id });
  return deleted.length > 0;
}

/** Create the real transaction that records a manually completed occurrence.
 *  The `(recurring_item_id, due day)` lookup makes repeated taps idempotent,
 *  while the foreign key gives reconciliation an exact match from now on. */
export async function markRecurringOccurrencePaid(
  userId: string,
  id: string,
  dueDate: string,
): Promise<Transaction | null> {
  const db = getDb();
  const item = (
    await db
      .select()
      .from(recurringItems)
      .where(and(eq(recurringItems.id, id), eq(recurringItems.userId, userId)))
      .limit(1)
  )[0];
  if (!item) return null;
  const validOccurrence = recurringOccurrencesForMonth(
    [toRecurringItem(item)],
    dueDate.slice(0, 7),
  ).some((occurrence) => occurrence.dueDateKey === dueDate);
  if (!validOccurrence)
    throw new InvalidRecurringOccurrenceError("Occurrence is not on this schedule.");

  // Date-only occurrences are stored at UTC noon, matching transaction input
  // normalization and avoiding a west-of-UTC date shift in the UI.
  const occurredAt = new Date(`${dueDate}T12:00:00.000Z`);
  const nextDay = new Date(occurredAt);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);
  const existing = (
    await db
      .select({ txn: transactions, category: categories })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.recurringItemId, item.id),
          gte(transactions.occurredAt, occurredAt),
          lt(transactions.occurredAt, nextDay),
        ),
      )
      .orderBy(desc(transactions.createdAt))
      .limit(1)
  )[0];
  if (existing) return toTransaction(existing.txn, existing.category);

  const [row] = await db
    .insert(transactions)
    .values({
      userId,
      recurringItemId: item.id,
      merchant: item.name,
      amountCents: item.amountCents,
      categoryId: item.categoryId,
      occurredAt,
      kind: item.amountCents > 0 ? "income" : "expense",
      source: "manual",
    })
    .returning();
  const category = row.categoryId
    ? ((await db.select().from(categories).where(eq(categories.id, row.categoryId)))[0] ?? null)
    : null;
  return toTransaction(row, category);
}
