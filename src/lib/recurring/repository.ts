import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { recurringItems } from "@/db/schema";
import type { RecurringItem } from "@/lib/types";
import type { RecurringInput } from "./validation";
import { toRecurringItem } from "./dto";

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
    .values({ userId, ...input, cadence: "monthly", sortOrder: Number(count) })
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
