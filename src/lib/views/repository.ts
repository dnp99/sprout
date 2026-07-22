import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { savedViews } from "@/db/schema";
import { sanitizeFilters, type SavedView, type ViewFilters } from "./types";

/** List a user's saved views, newest first. */
export async function listViews(userId: string): Promise<SavedView[]> {
  const db = getDb();
  const rows = await db
    .select({ id: savedViews.id, name: savedViews.name, filters: savedViews.filters })
    .from(savedViews)
    .where(eq(savedViews.userId, userId))
    .orderBy(desc(savedViews.createdAt));
  return rows.map((r) => ({ id: r.id, name: r.name, filters: sanitizeFilters(r.filters) }));
}

/** Create a named view from a filter set. */
export async function createView(
  userId: string,
  name: string,
  filters: ViewFilters,
): Promise<SavedView> {
  const db = getDb();
  const [row] = await db
    .insert(savedViews)
    .values({ userId, name, filters })
    .returning({ id: savedViews.id, name: savedViews.name, filters: savedViews.filters });
  return { id: row.id, name: row.name, filters: sanitizeFilters(row.filters) };
}

/** Rename a view. */
export async function renameView(userId: string, id: string, name: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .update(savedViews)
    .set({ name })
    .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
    .returning({ id: savedViews.id });
  return rows.length > 0;
}

/** Delete a view. */
export async function deleteView(userId: string, id: string): Promise<boolean> {
  const db = getDb();
  const rows = await db
    .delete(savedViews)
    .where(and(eq(savedViews.id, id), eq(savedViews.userId, userId)))
    .returning({ id: savedViews.id });
  return rows.length > 0;
}
