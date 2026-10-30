import { and, eq, gt, ne, count } from "drizzle-orm";
import { getDb } from "@/db";
import {
  notificationPreferences as prefs,
  pushSubscriptions as subscriptions,
  sessions,
  users,
} from "@/db/schema";
import { pushConfig } from "./config";
import type { parsePreferences, parseSubscription } from "./validation";
import type { NotificationSettings } from "./dto";

/** Derive both account and session identity from the HttpOnly session token. */
export async function notificationSession(token: string | undefined) {
  if (!token) return null;
  const [session] = await getDb()
    .select()
    .from(sessions)
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())));
  return session ?? null;
}
export async function settings(userId: string, sessionId: string): Promise<NotificationSettings> {
  const [p] = await getDb().select().from(prefs).where(eq(prefs.userId, userId));
  const [s] = await getDb()
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.sessionId, sessionId));
  return {
    configured: !!pushConfig(),
    publicKey: pushConfig()?.publicKey ?? null,
    groupActivity: p?.groupActivity ?? false,
    weeklyReminder: p?.weeklyReminder ?? false,
    timeZone: p?.timeZone ?? "America/Toronto",
    subscribed: !!s,
  };
}
export async function savePreferences(userId: string, values: ReturnType<typeof parsePreferences>) {
  await getDb()
    .insert(prefs)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: prefs.userId, set: values });
}
/** Endpoint reassignment requires the browser's existing encryption credentials.
 * A subscription is rebound on explicit opt-in, never merely on account sign-in. */
export async function subscribe(
  userId: string,
  sessionId: string,
  value: ReturnType<typeof parseSubscription>,
) {
  await getDb().transaction(async (tx) => {
    await tx.select({ id: users.id }).from(users).where(eq(users.id, userId)).for("update");
    const [existing] = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.endpoint, value.endpoint));
    if (existing && (existing.auth !== value.auth || existing.p256dh !== value.p256dh))
      throw Error("Subscription unavailable.");
    const [size] = await tx
      .select({ total: count() })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId));
    if (!existing && size.total >= 10) throw Error("Too many notification devices.");
    // One device per login; refreshes cannot leave duplicate endpoints behind.
    await tx
      .delete(subscriptions)
      .where(
        and(eq(subscriptions.sessionId, sessionId), ne(subscriptions.endpoint, value.endpoint)),
      );
    await tx
      .insert(subscriptions)
      .values({ userId, sessionId, ...value })
      .onConflictDoUpdate({
        target: subscriptions.endpoint,
        set: { userId, sessionId, p256dh: value.p256dh, auth: value.auth },
      });
  });
}
export async function unsubscribe(sessionId: string) {
  await getDb().delete(subscriptions).where(eq(subscriptions.sessionId, sessionId));
}
