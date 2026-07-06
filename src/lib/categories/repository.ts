import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { toCategory } from "@/lib/transactions/dto";
import type { Category } from "@/lib/types";
import type { CategoryInput } from "./validation";

/** Create a category, appended after the user's existing ones. New categories
 *  start with zero spend. */
export async function createCategory(userId: string, input: CategoryInput): Promise<Category> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(categories)
    .where(eq(categories.userId, userId));
  const [row] = await db
    .insert(categories)
    .values({ userId, ...input, sortOrder: Number(count) })
    .returning();
  return toCategory(row, 0);
}

/** Update a category (name/emoji/color/budget), scoped to the owner. Returns
 *  null if the id isn't the user's. Spent is re-derived by the next reload. */
export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<Category | null> {
  const [row] = await getDb()
    .update(categories)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning();
  return row ? toCategory(row, 0) : null;
}

/** Delete a category, scoped to the owner. Transactions that referenced it are
 *  left in place with a NULL category (ON DELETE SET NULL) — i.e. they become
 *  uncategorized rather than being deleted. Returns false if not the user's. */
export async function deleteCategory(userId: string, id: string): Promise<boolean> {
  const rows = await getDb()
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.userId, userId)))
    .returning({ id: categories.id });
  return rows.length > 0;
}
