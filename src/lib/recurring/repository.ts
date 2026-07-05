import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { recurringItems } from "@/db/schema";
import type { RecurringItem } from "@/lib/types";
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
