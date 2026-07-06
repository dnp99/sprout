import { and, asc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals } from "@/db/schema";
import type { Goal } from "@/lib/types";
import type { GoalInput } from "./validation";
import { toGoal } from "./dto";

/** All of a user's savings goals, in display order. */
export async function listGoals(userId: string): Promise<Goal[]> {
  const rows = await getDb()
    .select()
    .from(goals)
    .where(eq(goals.userId, userId))
    .orderBy(asc(goals.sortOrder), asc(goals.createdAt));
  return rows.map(toGoal);
}

/** Create a goal, appended after the user's existing goals. */
export async function createGoal(userId: string, input: GoalInput): Promise<Goal> {
  const db = getDb();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(goals)
    .where(eq(goals.userId, userId));
  const [row] = await db
    .insert(goals)
    .values({ userId, ...input, sortOrder: Number(count) })
    .returning();
  return toGoal(row);
}

/** Update a goal, scoped to the owner. Returns null if not the user's. */
export async function updateGoal(
  userId: string,
  id: string,
  input: GoalInput,
): Promise<Goal | null> {
  const [row] = await getDb()
    .update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  return row ? toGoal(row) : null;
}

/** Delete a goal, scoped to the owner. Returns false if not found. */
export async function deleteGoal(userId: string, id: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning({ id: goals.id });
  return deleted.length > 0;
}
