import webpush from "web-push";
import { and, eq, gt, isNull, lt, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  notificationJobs as jobs,
  notificationPreferences as prefs,
  pushSubscriptions as subscriptions,
  sessions,
  groupMembers,
  groups,
} from "@/db/schema";
import { pushConfig } from "./config";
import { weeklyReminderKey } from "./schedule";
import { notificationCopy } from "./messages";
import { readGroupNotificationDetails, type GroupNotificationDetails } from "./group-details";

/** Hourly scheduling is independent of app launches and follows each saved IANA timezone. */
export async function queueWeeklyReminders(now = new Date()) {
  const rows = await getDb()
    .select({ id: subscriptions.id, zone: prefs.timeZone })
    .from(subscriptions)
    .innerJoin(prefs, eq(prefs.userId, subscriptions.userId))
    .innerJoin(sessions, eq(sessions.id, subscriptions.sessionId))
    .where(and(eq(prefs.weeklyReminder, true), gt(sessions.expiresAt, now)));
  const due = rows.flatMap((r) => {
    const key = weeklyReminderKey(now, r.zone);
    return key ? [{ subscriptionId: r.id, kind: "weekly", dedupeKey: key }] : [];
  });
  if (due.length) await getDb().insert(jobs).values(due).onConflictDoNothing();
}
/** Recheck session, consent and membership at delivery, after an outbox lease is claimed. */
async function deliver(job: typeof jobs.$inferSelect) {
  const config = pushConfig();
  if (!config) return;
  const db = getDb(),
    now = new Date();
  const [target] = await db
    .select({ subscription: subscriptions, preference: prefs })
    .from(subscriptions)
    .innerJoin(prefs, eq(prefs.userId, subscriptions.userId))
    .innerJoin(sessions, eq(sessions.id, subscriptions.sessionId))
    .where(and(eq(subscriptions.id, job.subscriptionId), gt(sessions.expiresAt, now)));
  let allowed =
    !!target &&
    (job.kind === "group" ? target.preference.groupActivity : target.preference.weeklyReminder);
  let details: GroupNotificationDetails | null = null;
  if (allowed && job.kind === "group") {
    const [member] = await db
      .select({ id: groupMembers.id, groupName: groups.name })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(
        and(
          eq(groupMembers.groupId, job.groupId!),
          eq(groupMembers.userId, target.subscription.userId),
          eq(groupMembers.status, "active"),
          isNull(groups.archivedAt),
        ),
      );
    if (member)
      details = await readGroupNotificationDetails(job.groupId!, member.groupName, job.dedupeKey);
    allowed = !!member && !!details;
  }
  if (!allowed || now.getTime() - job.createdAt.getTime() > 86400000) {
    await db.update(jobs).set({ completedAt: now }).where(eq(jobs.id, job.id));
    return;
  }
  try {
    const s = target.subscription;
    await webpush.sendNotification(
      { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
      JSON.stringify({
        ...notificationCopy(target.preference.locale, details ?? undefined),
        tag: job.id,
        url: job.kind === "group" ? `/groups/${job.groupId}/transactions` : "/transactions",
      }),
      {
        vapidDetails: config,
        TTL: job.kind === "group" ? 3600 : 21600,
        timeout: 4000,
        urgency: "normal",
      },
    );
    await db.update(jobs).set({ completedAt: new Date() }).where(eq(jobs.id, job.id));
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410)
      await db.delete(subscriptions).where(eq(subscriptions.id, job.subscriptionId));
    else
      await db
        .update(jobs)
        .set({ availableAt: new Date(Date.now() + Math.min(3600000, 60000 * 2 ** job.attempts)) })
        .where(eq(jobs.id, job.id));
  }
}
/** Leases prevent concurrent saves/schedulers from sending the same job simultaneously.
 * Delivery is at least once: the OS tag collapses retries after a process crash. */
export async function dispatchNotifications() {
  if (!pushConfig()) return { processed: 0 };
  const db = getDb();
  const batch = await db.transaction(async (tx) => {
    const selected = await tx
      .select()
      .from(jobs)
      .where(and(isNull(jobs.completedAt), lte(jobs.availableAt, new Date()), lt(jobs.attempts, 5)))
      .orderBy(jobs.availableAt)
      .limit(100)
      .for("update", { skipLocked: true });
    for (const job of selected)
      await tx
        .update(jobs)
        .set({ attempts: sql`${jobs.attempts} + 1`, availableAt: new Date(Date.now() + 300000) })
        .where(eq(jobs.id, job.id));
    return selected;
  });
  for (let i = 0; i < batch.length; i += 10) await Promise.all(batch.slice(i, i + 10).map(deliver));
  await db.delete(jobs).where(lt(jobs.createdAt, new Date(Date.now() - 30 * 86400000)));
  return { processed: batch.length };
}
