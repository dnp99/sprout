import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import {
  groups,
  groupMembers,
  groupEntries,
  groupEntryShares,
  groupRepayments,
  groupActivity,
  users,
} from "@/db/schema";
import type { GroupEntry, GroupRepayment } from "./dto";
import { GroupError } from "./validation";

export type GroupTx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export type MemberRow = typeof groupMembers.$inferSelect;

/** User-before-group locking also serializes writes against account deletion. */
export async function lockUser(tx: GroupTx, userId: string) {
  const [user] = await tx.select().from(users).where(eq(users.id, userId)).for("update");
  if (!user) throw new GroupError("Please sign in again.", 401);
  return user;
}
export async function groupContext(tx: GroupTx, userId: string, groupId: string, write = false) {
  if (write) await lockUser(tx, userId);
  const [group] = await tx
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .for(write ? "update" : "share");
  const [actor] = await tx
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.userId, userId),
        eq(groupMembers.status, "active"),
      ),
    );
  if (!group || !actor) throw new GroupError("Group unavailable or access removed.", 404);
  return { group, actor };
}
export function owner(actor: MemberRow) {
  if (actor.role !== "owner") throw new GroupError("Only the group owner can do this.", 403);
}
/** Changing another author’s financial record needs both authority and an audit reason. */
export function canCorrect(actor: MemberRow, authorId: string, reason: string) {
  if (actor.id === authorId) return;
  owner(actor);
  if (!reason) throw new GroupError("Explain the owner correction.");
}
export async function activity(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  action: string,
  entityId: string | null,
  detail: unknown = {},
) {
  await tx.insert(groupActivity).values({ groupId, actorId, action, entityId, detail });
}
/** Dates are serialized once at the boundary, never left as driver-specific values. */
export async function ledger(tx: GroupTx, groupId: string) {
  const rows = await tx.select().from(groupEntries).where(eq(groupEntries.groupId, groupId));
  const shares = rows.length
    ? await tx
        .select()
        .from(groupEntryShares)
        .where(
          inArray(
            groupEntryShares.entryId,
            rows.map((e) => e.id),
          ),
        )
    : [];
  const entries: GroupEntry[] = rows.map((e) => ({
    ...e,
    voidedAt: e.voidedAt?.toISOString() ?? null,
    shares: shares
      .filter((s) => s.entryId === e.id)
      .map(({ memberId, amountCents, weight }) => ({ memberId, amountCents, weight })),
  }));
  const payments = await tx
    .select()
    .from(groupRepayments)
    .where(eq(groupRepayments.groupId, groupId));
  const repayments: GroupRepayment[] = payments.map((r) => ({
    ...r,
    reversedAt: r.reversedAt?.toISOString() ?? null,
  }));
  return { entries, repayments };
}
