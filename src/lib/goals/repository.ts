import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { goals } from "@/db/schema";
import type { Goal } from "@/lib/types";
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
