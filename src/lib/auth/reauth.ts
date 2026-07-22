import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "./password";

/** Re-authenticate a signed-in user by their current password, before a
 *  sensitive action (change password, delete account). Fetches the hash by id
 *  (getSessionUser deliberately doesn't expose it). Failures are generic so they
 *  never reveal whether an account or password field exists. */
export type ReauthResult = { ok: true } | { ok: false; reason: "no_password" | "wrong_password" };

export async function verifyUserPassword(userId: string, password: string): Promise<ReauthResult> {
  if (!password) return { ok: false, reason: "wrong_password" };
  const db = getDb();
  const [row] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  // No hash (legacy/seed accounts) can't be re-authed by password.
  if (!row || !row.passwordHash) return { ok: false, reason: "no_password" };
  const matches = await verifyPassword(password, row.passwordHash);
  return matches ? { ok: true } : { ok: false, reason: "wrong_password" };
}
