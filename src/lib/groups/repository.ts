import { readSplitDefaults } from "./split-repository";
import { listGroupMembers } from "./members";
import { searchLedger, type GroupLedgerFilters } from "./search";
import { calendarDays } from "@/lib/calendar";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, desc, gte, count } from "drizzle-orm";
import { getDb } from "@/db";
import {
  groups,
  groupMembers,
  groupCategories,
  groupBudgets,
  groupBudgetAllocations,
  groupActivity,
  groupInvites,
  groupMutations,
  groupInviteAttempts,
} from "@/db/schema";
import { DEFAULT_CATEGORIES } from "@/lib/auth/defaultCategories";
import { groupContext, lockUser, activity, type GroupTx } from "./context";
import { balances, transfers, monthlySummary } from "./accounting";
import { ledger } from "./context";
import { GroupError } from "./validation";
import type { GroupSnapshot, GroupListItem } from "./dto";
import type { parseOperation } from "./validation";
import { applyOperation } from "./operations";

/** Raw invitation codes must never be persisted with shared group data. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
/** Membership, not an arbitrary URL ID, determines the visible group list. */
export async function listGroups(userId: string): Promise<GroupListItem[]> {
  const rows = await getDb()
    .select({ group: groups, member: groupMembers })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(and(eq(groupMembers.userId, userId), eq(groupMembers.status, "active")))
    .orderBy(groups.createdAt);
  return rows.map(({ group, member }) => ({
    ...group,
    archivedAt: group.archivedAt?.toISOString() ?? null,
    memberId: member.id,
    role: member.role,
  }));
}
/** Account locking makes a retried create safe before its owner membership exists. */
export async function createGroup(userId: string, name: string, key: string = randomUUID()) {
  return getDb().transaction(async (tx) => {
    const user = await lockUser(tx, userId);
    const digest = hashToken(JSON.stringify({ type: "create", name }));
    const [receipt] = await tx
      .select({ mutation: groupMutations })
      .from(groupMutations)
      .innerJoin(groupMembers, eq(groupMembers.id, groupMutations.actorId))
      .where(and(eq(groupMutations.key, key), eq(groupMembers.userId, userId)));
    if (receipt) {
      if (receipt.mutation.payloadHash !== digest)
        throw new GroupError("This save identifier was already used.", 409);
      return receipt.mutation.result as { id: string };
    }
    const existingGroups = await tx
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.userId, userId), eq(groupMembers.role, "owner")));
    if (existingGroups.length >= 50) throw new GroupError("Maximum 50 owned groups.");
    const [group] = await tx.insert(groups).values({ name }).returning();
    const [member] = await tx
      .insert(groupMembers)
      .values({ groupId: group.id, userId, name: user.name, role: "owner" })
      .returning();
    await tx.insert(groupCategories).values(
      DEFAULT_CATEGORIES.map((c) => ({
        groupId: group.id,
        name: c.name,
        emoji: c.emoji,
        color: c.color,
      })),
    );
    await activity(tx, group.id, member.id, "created", group.id);
    await tx.insert(groupMutations).values({
      groupId: group.id,
      actorId: member.id,
      key,
      payloadHash: digest,
      result: { id: group.id },
    });
    return { id: group.id };
  });
}
function validateInvite(token: string) {
  if (!/^[a-f0-9]{48}$/.test(token)) throw new GroupError("Invalid or expired invitation.", 404);
}
/** Attempts commit separately, so invalid invitation lookups cannot roll back
 * the rate limiter. Locking the account serializes attempts across instances. */
async function checkInviteRate(userId: string) {
  await getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    const [recent] = await tx
      .select({ count: count() })
      .from(groupInviteAttempts)
      .where(
        and(
          eq(groupInviteAttempts.userId, userId),
          gte(groupInviteAttempts.createdAt, new Date(Date.now() - 3600000)),
        ),
      );
    if (recent.count >= 30)
      throw new GroupError("Too many invitation attempts. Try again in an hour.", 429);
    await tx.insert(groupInviteAttempts).values({ userId });
  });
}
/** Disclose only a group name until a signed-in user explicitly joins. */
export async function previewInvite(userId: string, token: string) {
  await checkInviteRate(userId);
  validateInvite(token);
  const [row] = await getDb()
    .select({ invite: groupInvites, group: groups })
    .from(groupInvites)
    .innerJoin(groups, eq(groups.id, groupInvites.groupId))
    .where(eq(groupInvites.tokenHash, hashToken(token)));
  if (
    !row ||
    row.group.archivedAt ||
    row.invite.revokedAt ||
    row.invite.usedAt ||
    row.invite.expiresAt < new Date()
  )
    throw new GroupError("Invalid or expired invitation.", 404);
  return { id: row.group.id, name: row.group.name, allHistory: true, userId };
}
/** Re-read the invitation under the same lock used by removals and revocations. */
export async function joinGroup(userId: string, token: string) {
  await checkInviteRate(userId);
  validateInvite(token);
  return getDb().transaction(async (tx) => {
    const user = await lockUser(tx, userId);
    const [lookup] = await tx
      .select()
      .from(groupInvites)
      .where(eq(groupInvites.tokenHash, hashToken(token)));
    if (!lookup) throw new GroupError("Invalid or expired invitation.", 404);
    const [group] = await tx
      .select()
      .from(groups)
      .where(eq(groups.id, lookup.groupId))
      .for("update");
    const [invite] = await tx.select().from(groupInvites).where(eq(groupInvites.id, lookup.id));
    const [existing] = await tx
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.userId, userId)));
    // Retrying a successful join remains safe even though its token was consumed.
    if (existing?.status === "active") return { id: group.id };
    if (group.archivedAt || invite.revokedAt || invite.usedAt || invite.expiresAt < new Date())
      throw new GroupError("Invalid or expired invitation.", 404);
    if (existing && invite.reactivateMemberId !== existing.id)
      throw new GroupError(
        "Ask the owner for a new invitation to reactivate your membership.",
        403,
      );
    if (invite.reactivateMemberId && invite.reactivateMemberId !== existing?.id)
      throw new GroupError("This invitation is for another member.", 403);
    const count = await tx
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.status, "active")));
    if (count.length >= 100) throw new GroupError("This group has reached its member limit.");
    const [member] = existing
      ? await tx
          .update(groupMembers)
          .set({ status: "active", name: user.name, updatedAt: new Date() })
          .where(eq(groupMembers.id, existing.id))
          .returning()
      : await tx
          .insert(groupMembers)
          .values({ groupId: group.id, userId, name: user.name })
          .returning();
    await tx.update(groupInvites).set({ usedAt: new Date() }).where(eq(groupInvites.id, invite.id));
    await tx
      .update(groups)
      .set({ revision: group.revision + 1, updatedAt: new Date() })
      .where(eq(groups.id, group.id));
    await activity(tx, group.id, member.id, "joined", member.id);
    return { id: group.id };
  });
}
/** Read under a shared group lock so summaries and rows describe one financial revision. */
export async function getGroup(
  userId: string,
  groupId: string,
  month: string,
  page = 0,
  filters: GroupLedgerFilters = {},
): Promise<GroupSnapshot> {
  return getDb().transaction(async (tx) => {
    const { group, actor } = await groupContext(tx, userId, groupId);
    const members = await listGroupMembers(tx, groupId);
    const splits = await readSplitDefaults(tx, groupId, group.splitMethod, members);
    const categories = await tx
      .select()
      .from(groupCategories)
      .where(eq(groupCategories.groupId, groupId))
      .orderBy(groupCategories.createdAt);
    const { entries, repayments } = await ledger(tx, groupId);
    const [budget] = await tx
      .select()
      .from(groupBudgets)
      .where(and(eq(groupBudgets.groupId, groupId), eq(groupBudgets.month, month)));
    const allocations = budget
      ? await tx
          .select()
          .from(groupBudgetAllocations)
          .where(eq(groupBudgetAllocations.budgetId, budget.id))
      : [];
    const balance = balances(entries, repayments);
    const filtered = searchLedger(entries, month, filters);
    const calendarDates = new Set(calendarDays(month));
    const events = await tx
      .select()
      .from(groupActivity)
      .where(eq(groupActivity.groupId, groupId))
      .orderBy(desc(groupActivity.createdAt))
      .limit(100);
    const invites =
      actor.role === "owner"
        ? await tx
            .select()
            .from(groupInvites)
            .where(eq(groupInvites.groupId, groupId))
            .orderBy(desc(groupInvites.createdAt))
            .limit(50)
        : [];
    return {
      group: {
        ...group,
        archivedAt: group.archivedAt?.toISOString() ?? null,
        memberId: actor.id,
        role: actor.role,
      },
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        status: m.status,
        userId: m.userId,
      })),
      categories,
      ...splits,
      entries: filtered.slice(page * 50, page * 50 + 50),
      calendarEntries: entries.filter(
        (entry) => !entry.voidedAt && calendarDates.has(entry.occurredOn),
      ),
      reportEntries: entries.filter((entry) => !entry.voidedAt),
      totalEntries: filtered.length,
      page,
      repayments: repayments.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn)),
      balances: balance,
      transfers: transfers(balance),
      summary: monthlySummary(entries, month, actor.id),
      budget: {
        poolCents: budget?.poolCents ?? 0,
        exists: !!budget,
        allocations: Object.fromEntries(allocations.map((a) => [a.categoryId, a.amountCents])),
      },
      activity: events.map((e) => ({
        ...e,
        reason:
          e.detail && typeof e.detail === "object" && "reason" in e.detail
            ? String(e.detail.reason ?? "")
            : "",
        createdAt: e.createdAt.toISOString(),
      })),
      invites: invites.map((i) => ({
        id: i.id,
        expiresAt: i.expiresAt.toISOString(),
        used: !!i.usedAt,
        revoked: !!i.revokedAt,
      })),
    };
  });
}
/** Idempotency and the group lock cover the entire write, including audit rows. */
export async function mutateGroup(
  userId: string,
  groupId: string,
  input: ReturnType<typeof parseOperation>,
) {
  return getDb().transaction(async (tx) => {
    const { group, actor } = await groupContext(tx, userId, groupId, true);
    const digest = hashToken(JSON.stringify(input.operation));
    const [prior] = await tx
      .select()
      .from(groupMutations)
      .where(
        and(
          eq(groupMutations.groupId, groupId),
          eq(groupMutations.actorId, actor.id),
          eq(groupMutations.key, input.key),
        ),
      );
    if (prior) {
      if (prior.payloadHash !== digest)
        throw new GroupError("This save identifier was already used.", 409);
      return prior.result;
    }
    if (group.revision !== input.revision)
      throw new GroupError(
        "Someone changed this group. Reload and review before saving again.",
        409,
      );
    if (
      group.archivedAt &&
      !(
        input.operation.type === "settings" ||
        input.operation.type === "leave" ||
        input.operation.type === "transfer"
      )
    )
      throw new GroupError("This group is archived and read-only.", 409);
    const result = await applyOperation(tx, group, actor, input.operation);
    await tx
      .update(groups)
      .set({ revision: group.revision + 1, updatedAt: new Date() })
      .where(eq(groups.id, group.id));
    // Invitation secrets are returned once, never saved in mutation receipts.
    const receipt = { ...result };
    delete receipt.token;
    await tx
      .insert(groupMutations)
      .values({ groupId, actorId: actor.id, key: input.key, payloadHash: digest, result: receipt });
    return result;
  });
}
/** The one-time response is the only copy of the raw bearer invitation. */
export async function issueInvite(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  reactivateMemberId: string | null,
) {
  const token = randomBytes(24).toString("hex");
  const [invite] = await tx
    .insert(groupInvites)
    .values({
      groupId,
      createdBy: actorId,
      reactivateMemberId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 86400000),
    })
    .returning();
  return { id: invite.id, token };
}
