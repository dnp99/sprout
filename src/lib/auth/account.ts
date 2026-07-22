import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";

/** Account-level mutations (password change, deletion). Thin DB wrappers so the
 *  route handlers stay testable by mocking this module. */

/** Set a new bcrypt password hash for a user. */
export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  const db = getDb();
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** Hard-delete a user and, via ON DELETE CASCADE, every row that references
 *  them — transactions, categories, goals, recurring, accounts, merchant rules,
 *  API tokens, WhatsApp links, and sessions. Irreversible. The delete endpoint
 *  re-authenticates and confirms before calling this. */
export async function deleteUser(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
}
