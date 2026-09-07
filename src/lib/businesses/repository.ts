import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { businesses } from "@/db/schema";
import type { Business } from "@/lib/types";
import type { BusinessInput } from "./validation";

const toBusiness = (row: typeof businesses.$inferSelect): Business => ({
  id: row.id,
  name: row.name,
  emoji: row.emoji,
  color: row.color,
  sortOrder: row.sortOrder,
});

export async function listBusinesses(userId: string): Promise<Business[]> {
  return (
    await getDb()
      .select()
      .from(businesses)
      .where(eq(businesses.userId, userId))
      .orderBy(asc(businesses.sortOrder))
  ).map(toBusiness);
}

export async function createBusiness(userId: string, input: BusinessInput): Promise<Business> {
  const [row] = await getDb()
    .insert(businesses)
    .values({ userId, ...input, sortOrder: 0 })
    .returning();
  return toBusiness(row);
}

export async function updateBusiness(
  userId: string,
  id: string,
  input: BusinessInput,
): Promise<Business | null> {
  const [row] = await getDb()
    .update(businesses)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(businesses.id, id), eq(businesses.userId, userId)))
    .returning();
  return row ? toBusiness(row) : null;
}

/** Referential ownership check prevents assigning another user's business UUID. */
export async function userOwnsBusiness(userId: string, id: string): Promise<boolean> {
  return (
    (
      await getDb()
        .select({ id: businesses.id })
        .from(businesses)
        .where(and(eq(businesses.id, id), eq(businesses.userId, userId)))
        .limit(1)
    ).length === 1
  );
}

/** Deletion relies on FK SET NULL: transactions remain, only their assignment clears. */
export async function deleteBusiness(userId: string, id: string): Promise<boolean> {
  return (
    (
      await getDb()
        .delete(businesses)
        .where(and(eq(businesses.id, id), eq(businesses.userId, userId)))
        .returning({ id: businesses.id })
    ).length > 0
  );
}
