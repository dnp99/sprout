import { and, asc, eq, inArray, isNull, lt, ne, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { goals, transactions } from "@/db/schema";
import { roundUpCents } from "@/lib/roundups";
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
  if (input.isRoundupTarget) {
    await db
      .update(goals)
      .set({ isRoundupTarget: false })
      .where(and(eq(goals.userId, userId), ne(goals.id, row.id)));
  }
  return toGoal(row);
}

/** Update a goal, scoped to the owner. Returns null if not the user's. Setting
 *  `isRoundupTarget` clears the flag on the user's other goals (single target). */
export async function updateGoal(
  userId: string,
  id: string,
  input: GoalInput,
): Promise<Goal | null> {
  const db = getDb();
  const [row] = await db
    .update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning();
  if (!row) return null;
  if (input.isRoundupTarget) {
    await db
      .update(goals)
      .set({ isRoundupTarget: false })
      .where(and(eq(goals.userId, userId), ne(goals.id, id)));
  }
  return toGoal(row);
}

/** Sweep the user's available round-ups into their designated round-up goal:
 *  total the spare change on unswept budget-counting expenses, add it to the
 *  goal's saved amount, and stamp those rows so a later sweep won't recount
 *  them. No target goal or no change → `{ sweptCents: 0 }`. Owner-scoped. */
export async function sweepRoundups(
  userId: string,
): Promise<{ sweptCents: number; goalId: string | null }> {
  const db = getDb();
  const [target] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.isRoundupTarget, true)))
    .limit(1);
  if (!target) return { sweptCents: 0, goalId: null };

  const rows = await db
    .select({ id: transactions.id, amountCents: transactions.amountCents })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.roundupSweptAt),
        eq(transactions.excludeFromBudget, false),
        lt(transactions.amountCents, 0),
      ),
    );

  let sweptCents = 0;
  const countedIds: string[] = [];
  for (const r of rows) {
    const c = roundUpCents(r.amountCents);
    if (c > 0) {
      sweptCents += c;
      countedIds.push(r.id);
    }
  }
  if (sweptCents === 0) return { sweptCents: 0, goalId: target.id };

  const now = new Date();
  await db
    .update(transactions)
    .set({ roundupSweptAt: now })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, countedIds)));
  await db
    .update(goals)
    .set({ savedCents: target.savedCents + sweptCents, updatedAt: now })
    .where(and(eq(goals.id, target.id), eq(goals.userId, userId)));

  return { sweptCents, goalId: target.id };
}

/** Delete a goal, scoped to the owner. Returns false if not found. */
export async function deleteGoal(userId: string, id: string): Promise<boolean> {
  const deleted = await getDb()
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)))
    .returning({ id: goals.id });
  return deleted.length > 0;
}
