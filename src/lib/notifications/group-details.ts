import { and, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { groupActivity, groupEntries, groupMembers, users } from "@/db/schema";

export type GroupNotificationDetails = {
  actor: string;
  group: string;
} & (
  | { action: "expense" | "income" | "refund"; amountCents: number; merchant: string }
  | { action: "imported" | "copied"; count: number }
);

/** Resolve the committed audit event only after delivery authorizes the recipient.
 * Reuse its existing dedupe identity instead of persisting financial data in the outbox. */
export async function readGroupNotificationDetails(
  groupId: string,
  group: string,
  dedupeKey: string,
): Promise<GroupNotificationDetails | null> {
  const eventId = /^group:([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.exec(dedupeKey)?.[1];
  if (!eventId) return null;
  const db = getDb();
  const [event] = await db
    .select({
      action: groupActivity.action,
      entityId: groupActivity.entityId,
      detail: groupActivity.detail,
      memberName: groupMembers.name,
      accountName: users.name,
    })
    .from(groupActivity)
    .innerJoin(groupMembers, eq(groupMembers.id, groupActivity.actorId))
    .leftJoin(users, eq(users.id, groupMembers.userId))
    .where(
      and(
        eq(groupActivity.id, eventId),
        eq(groupActivity.groupId, groupId),
        eq(groupMembers.groupId, groupId),
      ),
    );
  if (!event) return null;
  // The actor recorded the entry; the selected payer may be a different person.
  const actor = event.accountName ?? event.memberName;
  if (event.action === "entryAdded" && event.entityId) {
    const [entry] = await db
      .select({
        kind: groupEntries.kind,
        amountCents: groupEntries.amountCents,
        merchant: groupEntries.merchant,
      })
      .from(groupEntries)
      .where(
        and(
          eq(groupEntries.id, event.entityId),
          eq(groupEntries.groupId, groupId),
          isNull(groupEntries.voidedAt),
        ),
      );
    if (!entry || !["expense", "income", "refund"].includes(entry.kind)) return null;
    return {
      actor,
      group,
      action: entry.kind as "expense" | "income" | "refund",
      amountCents: entry.amountCents,
      merchant: entry.merchant,
    };
  }
  if (event.action === "imported" || event.action === "bulkCopied") {
    const detail = event.detail as { imported?: number; count?: number } | null;
    const count = event.action === "imported" ? detail?.imported : detail?.count;
    if (typeof count !== "number" || !Number.isInteger(count) || count < 1) return null;
    return { actor, group, action: event.action === "imported" ? "imported" : "copied", count };
  }
  return null;
}
