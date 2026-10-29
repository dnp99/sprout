import { createHash, randomUUID } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  groups,
  groupCategories,
  groupMembers,
  groupEntries,
  groupEntryShares,
  groupMutations,
} from "@/db/schema";
import { activity, canCorrect, groupContext, ledger, lockUser } from "./context";
import { listGroupMembers } from "./members";
import { groupTransactionsCsv } from "./export-csv";
import { readSplitDefaults } from "./split-repository";
import { GroupError } from "./validation";
import type { GroupBulkInput } from "./bulk-validation";
import { selectedGroupEntries, checkBulkEdit, planGroupCopy } from "./bulk-plan";

export interface GroupBulkResult {
  count: number;
  csv?: string;
  targetId?: string;
}
/** User-first, ordered group locks match account deletion and avoid opposite-copy deadlocks.
 * Receipt, revisions, entries and audit commit as one transaction, including retries. */
export async function bulkGroup(
  userId: string,
  groupId: string,
  input: GroupBulkInput,
): Promise<GroupBulkResult> {
  return getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    if (input.action === "copy" && input.targetId === groupId)
      throw new GroupError("Choose another group.");
    const groupIds = input.action === "copy" ? [groupId, input.targetId].sort() : [groupId];
    await tx
      .select({ id: groups.id })
      .from(groups)
      .where(inArray(groups.id, groupIds))
      .orderBy(groups.id)
      .for(input.action === "export" ? "share" : "update");
    const source = await groupContext(tx, userId, groupId);
    const target = input.action === "copy" ? await groupContext(tx, userId, input.targetId) : null;
    const digest = createHash("sha256").update(JSON.stringify(input)).digest("hex");
    const [receipt] = await tx
      .select()
      .from(groupMutations)
      .where(
        and(
          eq(groupMutations.groupId, groupId),
          eq(groupMutations.actorId, source.actor.id),
          eq(groupMutations.key, input.key),
        ),
      );
    if (receipt) {
      if (receipt.payloadHash !== digest)
        throw new GroupError("This batch identifier was already used.", 409);
      return receipt.result as unknown as GroupBulkResult;
    }
    if (
      source.group.revision !== input.revision ||
      (input.action === "copy" && target?.group.revision !== input.targetRevision)
    )
      throw new GroupError(
        "A group changed. Reload and review the selected records before trying again.",
        409,
      );
    const { entries } = await ledger(tx, groupId);
    const selected = selectedGroupEntries(entries, input.entries);
    const sourceCategories = await tx
      .select()
      .from(groupCategories)
      .where(eq(groupCategories.groupId, groupId));
    if (input.action === "export")
      return {
        count: selected.length,
        csv: groupTransactionsCsv(selected, await listGroupMembers(tx, groupId), sourceCategories),
      };
    if (source.group.archivedAt || target?.group.archivedAt)
      throw new GroupError("Archived groups are read-only.", 409);
    if (input.action === "copy" && target) {
      const members = await tx
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.groupId, target.group.id));
      if (input.payerId && !members.some((m) => m.id === input.payerId && m.status === "active"))
        throw new GroupError("Choose a current destination payer.");
      const categories = await tx
        .select()
        .from(groupCategories)
        .where(eq(groupCategories.groupId, target.group.id));
      const splits = await readSplitDefaults(
        tx,
        target.group.id,
        target.group.splitMethod,
        members,
      );
      const copies = planGroupCopy(
        selected,
        sourceCategories,
        { categories, ...splits },
        input,
        randomUUID,
      );
      await tx.insert(groupEntries).values(
        copies.map((entry) => ({
          id: entry.id,
          groupId: target.group.id,
          authorId: target.actor.id,
          payerId: entry.payerId,
          categoryId: entry.categoryId,
          kind: entry.kind,
          amountCents: entry.amountCents,
          merchant: entry.merchant,
          note: entry.note,
          occurredOn: entry.occurredOn,
          refundOf: entry.refundOf,
          settlement: entry.settlement,
          splitMethod: entry.splitMethod,
        })),
      );
      const shares = copies.flatMap((e) => e.shares.map((s) => ({ ...s, entryId: e.id })));
      for (let offset = 0; offset < shares.length; offset += 1000)
        await tx.insert(groupEntryShares).values(shares.slice(offset, offset + 1000));
      await activity(tx, target.group.id, target.actor.id, "bulkCopied", null, {
        count: copies.length,
        entries: copies.map((e) => e.id),
      });
      await activity(tx, groupId, source.actor.id, "bulkCopiedOut", null, {
        count: selected.length,
      });
      await tx
        .update(groups)
        .set({ revision: target.group.revision + 1, updatedAt: new Date() })
        .where(eq(groups.id, target.group.id));
    } else if (input.action !== "copy") {
      checkBulkEdit(entries, selected, input);
      if (input.action === "delete")
        for (const entry of selected) canCorrect(source.actor, entry.authorId, input.reason);
      if (
        input.action === "category" &&
        input.categoryId &&
        !sourceCategories.some((c) => c.id === input.categoryId && !c.archived)
      )
        throw new GroupError("Choose an active group category.");
      const patch =
        input.action === "delete"
          ? { voidedAt: new Date() }
          : input.action === "date"
            ? { occurredOn: input.occurredOn }
            : { categoryId: input.categoryId };
      await tx
        .update(groupEntries)
        .set({ ...patch, version: sql`${groupEntries.version} + 1`, updatedAt: new Date() })
        .where(
          and(
            eq(groupEntries.groupId, groupId),
            inArray(
              groupEntries.id,
              selected.map((e) => e.id),
            ),
          ),
        );
      await activity(
        tx,
        groupId,
        source.actor.id,
        input.action === "delete" ? "bulkVoided" : "bulkEdited",
        null,
        { before: selected, after: patch, reason: input.action === "delete" ? input.reason : "" },
      );
    }
    const result = {
      count: selected.length,
      ...(input.action === "copy" ? { targetId: input.targetId } : {}),
    };
    await tx
      .update(groups)
      .set({ revision: source.group.revision + 1, updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    await tx
      .insert(groupMutations)
      .values({ groupId, actorId: source.actor.id, key: input.key, payloadHash: digest, result });
    return result;
  });
}
