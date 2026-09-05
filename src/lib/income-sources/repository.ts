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

export async function deleteIncomeSource(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(incomeSources)
    .where(and(eq(incomeSources.id, id), eq(incomeSources.userId, userId)))
    .returning({ id: incomeSources.id });
  return rows.length > 0;
}
