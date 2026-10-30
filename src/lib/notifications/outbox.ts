import { and, eq, gt, ne } from "drizzle-orm";
import {
  groupMembers,
  notificationJobs,
  notificationPreferences,
  pushSubscriptions,
  sessions,
} from "@/db/schema";
import type { GroupTx } from "@/lib/groups/context";

/** Enqueue inside the ledger transaction, so retries and rollbacks cannot create phantom alerts. */
export async function queueGroupActivity(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  eventId: string,
) {
  const [actor] = await tx.select().from(groupMembers).where(eq(groupMembers.id, actorId));
  if (!actor?.userId) return;
  const recipients = await tx
    .select({ id: pushSubscriptions.id })
    .from(pushSubscriptions)
    .innerJoin(
      notificationPreferences,
      eq(notificationPreferences.userId, pushSubscriptions.userId),
    )
    .innerJoin(sessions, eq(sessions.id, pushSubscriptions.sessionId))
    .innerJoin(groupMembers, eq(groupMembers.userId, pushSubscriptions.userId))
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.status, "active"),
        ne(pushSubscriptions.userId, actor.userId),
        eq(notificationPreferences.groupActivity, true),
        gt(sessions.expiresAt, new Date()),
      ),
    );
  if (recipients.length)
    await tx
      .insert(notificationJobs)
      .values(
        recipients.map((s) => ({
          subscriptionId: s.id,
          groupId,
          kind: "group",
          dedupeKey: `group:${eventId}`,
        })),
      )
      .onConflictDoNothing();
}
