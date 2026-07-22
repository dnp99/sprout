import { and, eq, gt, lt, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import type { UserRow } from "@/db/schema";
import { generateToken, sessionExpiry } from "./session";

/** Create a session for a user and return the cookie token + expiry. */
export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb();
  const token = generateToken();
  const expiresAt = sessionExpiry();
  await db.insert(sessions).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

/** Resolve the user for a session token, or null if missing/expired. */
export async function findUserByToken(token: string): Promise<UserRow | null> {
  const db = getDb();
  const rows = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);
  return rows[0]?.user ?? null;
}

/** Revoke a single session (logout). */
export async function revokeSession(token: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.token, token));
}

/** Revoke every session for a user EXCEPT the current one (change-password,
 *  "sign out other devices"). Returns how many were revoked. */
export async function revokeOtherSessions(userId: string, keepToken: string): Promise<number> {
  const db = getDb();
  const removed = await db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), ne(sessions.token, keepToken)))
    .returning({ token: sessions.token });
  return removed.length;
}

/** Revoke every session for a user (full sign-out; also covered by the cascade
 *  when the user row is deleted, but explicit for clarity). */
export async function revokeAllSessions(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

/** Delete all expired sessions (housekeeping). */
export async function deleteExpiredSessions(): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(lt(sessions.expiresAt, new Date()));
}
