import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { lockUser } from "@/lib/groups/context";
import { toCategory } from "@/lib/transactions/dto";
import type { Category } from "@/lib/types";
import type { CategoryInput } from "./validation";

/** Serialize category definitions with organizer saves, including empty-tree inserts. */
export async function createCategory(userId: string, input: CategoryInput): Promise<Category> {
  return getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    const [last] = await tx
      .select({ order: sql<number>`coalesce(max(${categories.sortOrder}), -1)` })
      .from(categories)
      .where(eq(categories.userId, userId));
    const [row] = await tx
      .insert(categories)
      .values({ userId, ...input, sortOrder: Number(last.order) + 1 })
      .returning();
    return toCategory(row, 0);
  });
}
/** Identity changes never move or delete the category's transactions. */
export async function updateCategory(
  userId: string,
  id: string,
  input: CategoryInput,
): Promise<Category | null> {
  return getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    const [row] = await tx
      .update(categories)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning();
    return row ? toCategory(row, 0) : null;
  });
}
/** Promote children and preserve bills as uncategorized, atomically. */
export async function deleteCategory(userId: string, id: string): Promise<boolean> {
  return getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    const [owned] = await tx
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    if (!owned) return false;
    await tx
      .update(categories)
      .set({ parentId: null })
      .where(and(eq(categories.userId, userId), eq(categories.parentId, id)));
    const rows = await tx
      .delete(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)))
      .returning({ id: categories.id });
    return rows.length > 0;
  });
}
