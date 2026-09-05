import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { passwordResetRequests, passwordResetTokens, sessions, users } from "@/db/schema";

export const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_EMAIL_REQUESTS = 3;
const MAX_IP_REQUESTS = 8;

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** A reset token is high-entropy and its database representation is never usable as a credential. */
export function createResetToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashResetValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function resetExpiry(from = new Date()): Date {
  return new Date(from.getTime() + PASSWORD_RESET_TTL_MS);
}

/** Returns false when a request would exceed either anonymous abuse limit. */
export async function allowPasswordResetRequest(email: string, ip: string): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - RATE_WINDOW_MS);
  const emailHash = hashResetValue(email);
  const ipHash = hashResetValue(ip);

  return db.transaction(async (tx) => {
    const [emailCount, ipCount] = await Promise.all([
      tx
        .select({ count: sql<number>`count(*)::int` })
        .from(passwordResetRequests)
        .where(
          and(
            eq(passwordResetRequests.emailHash, emailHash),
            gt(passwordResetRequests.createdAt, since),
          ),
        ),
      tx
        .select({ count: sql<number>`count(*)::int` })
        .from(passwordResetRequests)
        .where(
          and(eq(passwordResetRequests.ipHash, ipHash), gt(passwordResetRequests.createdAt, since)),
        ),
    ]);
    const allowed =
      (emailCount[0]?.count ?? 0) < MAX_EMAIL_REQUESTS &&
      (ipCount[0]?.count ?? 0) < MAX_IP_REQUESTS;
    await tx.insert(passwordResetRequests).values({ emailHash, ipHash });
    return allowed;
  });
}

/** New requests invalidate earlier links for that account before issuing a replacement. */
export async function createPasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResetTokens.userId, userId), isNull(passwordResetTokens.usedAt)));
    await tx.insert(passwordResetTokens).values({ userId, tokenHash, expiresAt });
  });
}

/** Remove an undelivered link so a mail-provider outage cannot leave a usable token behind. */
export async function invalidatePasswordResetToken(tokenHash: string): Promise<void> {
  const db = getDb();
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(passwordResetTokens.tokenHash, tokenHash), isNull(passwordResetTokens.usedAt)));
}

/** Atomically consumes a valid link, changes the password, and signs every device out. */
export async function resetPasswordWithToken(
  tokenHash: string,
  passwordHash: string,
): Promise<boolean> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const [token] = await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, new Date()),
        ),
      )
      .returning({ userId: passwordResetTokens.userId });
    if (!token) return false;

    await tx
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, token.userId));
    await tx.delete(sessions).where(eq(sessions.userId, token.userId));
    return true;
  });
}
