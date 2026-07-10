import { randomBytes } from "node:crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { apiTokens, channelIdentities, channelLinkCodes } from "@/db/schema";
import { hashToken } from "./auth";

/** CRUD for the external-capture tables (plan 008): bearer tokens, the WhatsApp
 *  phone→user binding, and the one-time codes that establish it. */

const TOKEN_PREFIX = "sprt_";
const LINK_CODE_TTL_MS = 15 * 60 * 1000; // 15 min
// Unambiguous alphabet for link codes (no 0/O, 1/I/L).
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// How recent a capture must be for a bare "U"/"E" reply to still act on it.
const UNDO_WINDOW_MS = 5 * 60 * 1000; // 5 min

// --- API tokens (Siri Shortcut / scripts) -----------------------------------

export interface CreatedToken {
  id: string;
  /** The raw token — shown to the user **once**, never persisted. */
  token: string;
  /** The display prefix we do persist ("sprt_a1b2…"). */
  prefix: string;
}

/** Mint a bearer token for a user. We store only its sha256 hash + a display
 *  prefix, and return the raw token once. */
export async function createApiToken(userId: string, name: string): Promise<CreatedToken> {
  const db = getDb();
  const token = TOKEN_PREFIX + randomBytes(24).toString("base64url");
  const prefix = token.slice(0, 12);
  const [row] = await db
    .insert(apiTokens)
    .values({ userId, name, tokenHash: hashToken(token), tokenPrefix: prefix })
    .returning({ id: apiTokens.id });
  return { id: row.id, token, prefix };
}

/** List a user's tokens for the Settings UI (never the raw token or its hash). */
export async function listApiTokens(userId: string) {
  const db = getDb();
  return db
    .select({
      id: apiTokens.id,
      name: apiTokens.name,
      tokenPrefix: apiTokens.tokenPrefix,
      lastUsedAt: apiTokens.lastUsedAt,
      revokedAt: apiTokens.revokedAt,
      createdAt: apiTokens.createdAt,
    })
    .from(apiTokens)
    .where(eq(apiTokens.userId, userId))
    .orderBy(desc(apiTokens.createdAt));
}

/** Revoke a token (scoped to its owner). */
export async function revokeApiToken(userId: string, id: string): Promise<void> {
  const db = getDb();
  await db
    .update(apiTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(apiTokens.id, id), eq(apiTokens.userId, userId)));
}

// --- WhatsApp linking -------------------------------------------------------

/** Mint a one-time code shown in-app; the user texts `link <code>` to bind. */
export async function createLinkCode(userId: string): Promise<string> {
  const db = getDb();
  const code = `SPRT-${randomCode(4)}`;
  await db
    .insert(channelLinkCodes)
    .values({ code, userId, expiresAt: new Date(Date.now() + LINK_CODE_TTL_MS) });
  return code;
}

/** Redeem a link code: bind (channel, externalId) → the code's user as
 *  **verified**, and burn the code. Returns the userId, or null if the code is
 *  unknown/expired. Re-binding an existing phone just re-points it. */
export async function redeemLinkCode(
  code: string,
  channel: string,
  externalId: string,
): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ userId: channelLinkCodes.userId })
    .from(channelLinkCodes)
    .where(and(eq(channelLinkCodes.code, code), gt(channelLinkCodes.expiresAt, new Date())))
    .limit(1);
  const link = rows[0];
  if (!link) return null;

  const now = new Date();
  await db
    .insert(channelIdentities)
    .values({ userId: link.userId, channel, externalId, verifiedAt: now })
    .onConflictDoUpdate({
      target: [channelIdentities.channel, channelIdentities.externalId],
      set: { userId: link.userId, verifiedAt: now },
    });
  await db.delete(channelLinkCodes).where(eq(channelLinkCodes.code, code));
  return link.userId;
}

// --- Undo pointer (last reviewable ingest per identity) ---------------------

/** Point an identity at the row a follow-up `U`/`E` reply should act on. */
export async function stampLastIngest(
  channel: string,
  externalId: string,
  transactionId: string,
  at: Date = new Date(),
): Promise<void> {
  const db = getDb();
  await db
    .update(channelIdentities)
    .set({ lastIngestId: transactionId, lastIngestAt: at })
    .where(
      and(eq(channelIdentities.channel, channel), eq(channelIdentities.externalId, externalId)),
    );
}

/** The row id a bare reply refers to, if a capture happened within the undo
 *  window; else null (older rows are edited in-app, not by reply). */
export async function getLastIngest(
  channel: string,
  externalId: string,
  windowMs: number = UNDO_WINDOW_MS,
): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({
      lastIngestId: channelIdentities.lastIngestId,
      lastIngestAt: channelIdentities.lastIngestAt,
    })
    .from(channelIdentities)
    .where(
      and(eq(channelIdentities.channel, channel), eq(channelIdentities.externalId, externalId)),
    )
    .limit(1);
  const row = rows[0];
  if (!row?.lastIngestId || !row.lastIngestAt) return null;
  if (Date.now() - row.lastIngestAt.getTime() > windowMs) return null;
  return row.lastIngestId;
}

/** Clear the pointer after an undo, so a second `U` is a no-op. */
export async function clearLastIngest(channel: string, externalId: string): Promise<void> {
  const db = getDb();
  await db
    .update(channelIdentities)
    .set({ lastIngestId: null, lastIngestAt: null })
    .where(
      and(eq(channelIdentities.channel, channel), eq(channelIdentities.externalId, externalId)),
    );
}

/** Random uppercase code from the unambiguous alphabet. */
function randomCode(len: number): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}
