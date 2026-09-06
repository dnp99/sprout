import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { incomeSources } from "@/db/schema";
import type { IncomeSource } from "@/lib/types";

const toIncomeSource = (row: typeof incomeSources.$inferSelect): IncomeSource => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  sortOrder: row.sortOrder,
});

export async function listIncomeSources(userId: string): Promise<IncomeSource[]> {
  return (
    await getDb()
      .select()
      .from(incomeSources)
      .where(eq(incomeSources.userId, userId))
      .orderBy(asc(incomeSources.sortOrder))
  ).map(toIncomeSource);
}

export async function createIncomeSource(
  userId: string,
  name: string,
  emoji = "💰",
): Promise<IncomeSource> {
  const [row] = await getDb().insert(incomeSources).values({ userId, name, emoji }).returning();
  return toIncomeSource(row);
}

/** Check ownership before a transaction references a source. This prevents a
 *  guessed UUID from linking one user's income to another user's source. */
export async function userOwnsIncomeSource(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: incomeSources.id })
    .from(incomeSources)
    .where(and(eq(incomeSources.id, id), eq(incomeSources.userId, userId)))
    .limit(1);
  return rows.length === 1;
}

export async function deleteIncomeSource(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(incomeSources)
    .where(and(eq(incomeSources.id, id), eq(incomeSources.userId, userId)))
    .returning({ id: incomeSources.id });
  return rows.length > 0;
}
