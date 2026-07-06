import { eq, sql } from "drizzle-orm";
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
