import { createHash } from "node:crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { apiTokens, channelIdentities } from "@/db/schema";

/** Non-cookie auth for the ingest API (plan 008). Shortcuts and Twilio can't
 *  hold a cookie, so machines authenticate with a bearer token or a verified
 *  channel binding instead. */

/** sha256 hex of a token — the indexed exact-match lookup key. Tokens are
 *  high-entropy, so sha256 (fast) is right here, unlike passwords (bcrypt). */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Extract the token from an `Authorization: Bearer <token>` header. */
export function parseBearer(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1].trim() : null;
}

/** Resolve the userId for a bearer token, stamping `last_used_at`. Ignores
 *  revoked tokens; returns null on any miss. Mirrors `findUserByToken`, but for
 *  tokens rather than sessions. */
export async function resolveApiToken(
  authHeader: string | null | undefined,
): Promise<string | null> {
  const token = parseBearer(authHeader);
  if (!token) return null;

  const db = getDb();
  const rows = await db
    .select({ id: apiTokens.id, userId: apiTokens.userId })
    .from(apiTokens)
    .where(and(eq(apiTokens.tokenHash, hashToken(token)), isNull(apiTokens.revokedAt)))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  await db.update(apiTokens).set({ lastUsedAt: new Date() }).where(eq(apiTokens.id, row.id));
  return row.userId;
}

/** Resolve the userId bound to a **verified** channel identity (e.g. a WhatsApp
 *  phone), or null if the identity is unknown or not yet verified. */
export async function resolveChannelUser(
  channel: string,
  externalId: string,
): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ userId: channelIdentities.userId })
    .from(channelIdentities)
    .where(
      and(
        eq(channelIdentities.channel, channel),
        eq(channelIdentities.externalId, externalId),
        isNotNull(channelIdentities.verifiedAt),
      ),
    )
    .limit(1);
  return rows[0]?.userId ?? null;
}
