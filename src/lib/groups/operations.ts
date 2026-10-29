import { validateGroupCategoryNames } from "./category-tree";
import { saveCategoryTree } from "./category-tree-repository";
import { saveSplitDefaults } from "./split-repository";
import { and, eq } from "drizzle-orm";
import {
  groups,
  groupMembers,
  groupCategories,
  groupBudgets,
  groupBudgetAllocations,
  groupRepayments,
  groupInvites,
} from "@/db/schema";
import { activity, owner, type GroupTx, type MemberRow } from "./context";
import { GroupError, type GroupOperation } from "./validation";
import { saveEntry, voidEntry } from "./entries";
import { issueInvite } from "./repository";

type GroupRow = typeof groups.$inferSelect;
/** Every operation runs after the actor and group have been locked/revalidated. */
export async function applyOperation(
  tx: GroupTx,
  group: GroupRow,
  actor: MemberRow,
  op: GroupOperation,
): Promise<{ id?: string; token?: string }> {
  const groupId = group.id;
  if (op.type === "entry") return saveEntry(tx, groupId, actor, op.entry);
  if (op.type === "void") return voidEntry(tx, groupId, actor, op.id, op.version, op.reason);
  const members = await tx.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  if (op.type === "repayment") {
    const sender = members.find((m) => m.id === op.senderId),
      recipient = members.find((m) => m.id === op.recipientId);
    if (!sender || !recipient || sender.id === recipient.id)
      throw new GroupError("Choose two different group members.");
    if (actor.id !== sender.id && actor.id !== recipient.id) {
      owner(actor);
      if (!op.reason) throw new GroupError("Explain the owner override.");
    }
    if (sender.status !== "active" || recipient.status !== "active") {
      owner(actor);
      if (!op.reason) throw new GroupError("Explain payment involving a former member.");
    }
    const duplicates = await tx
      .select()
      .from(groupRepayments)
      .where(
        and(
          eq(groupRepayments.groupId, groupId),
          eq(groupRepayments.senderId, sender.id),
          eq(groupRepayments.recipientId, recipient.id),
          eq(groupRepayments.amountCents, op.amountCents),
          eq(groupRepayments.occurredOn, op.occurredOn),
        ),
      );
    const ids = duplicates
      .filter((r) => !r.reversedAt)
      .map((r) => r.id)
      .sort();
    if (ids.length && JSON.stringify(ids) !== JSON.stringify([...op.duplicateIds].sort()))
      throw new GroupError(
        "A matching payment already exists. Review before recording another.",
        409,
        { duplicateIds: ids },
      );
    const [r] = await tx
      .insert(groupRepayments)
      .values({
        groupId,
        senderId: sender.id,
        recipientId: recipient.id,
        recordedBy: actor.id,
        amountCents: op.amountCents,
        occurredOn: op.occurredOn,
        note: op.note,
      })
      .returning();
    await activity(tx, groupId, actor.id, "repaymentAdded", r.id, { after: r, reason: op.reason });
    return { id: r.id };
  }
  if (op.type === "reverse") {
    const [row] = await tx
      .select()
      .from(groupRepayments)
      .where(and(eq(groupRepayments.groupId, groupId), eq(groupRepayments.id, op.id)));
    if (!row || row.reversedAt)
      throw new GroupError("Payment unavailable or already reversed.", 409);
    if (actor.id !== row.senderId && actor.id !== row.recipientId) owner(actor);
    await tx
      .update(groupRepayments)
      .set({ reversedAt: new Date(), reversalReason: op.reason, reversedBy: actor.id })
      .where(eq(groupRepayments.id, row.id));
    await activity(tx, groupId, actor.id, "repaymentReversed", row.id, {
      before: row,
      reason: op.reason,
    });
    return { id: row.id };
  }
  if (op.type === "leave") {
    // Historical entries reference stable membership IDs; leaving changes access only.
    if (actor.role === "owner") {
      const successor = members
        .filter((m) => m.id !== actor.id && m.status === "active" && m.userId)
        .sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id),
        )[0];
      await tx
        .update(groupMembers)
        .set({ role: "member", updatedAt: new Date() })
        .where(eq(groupMembers.id, actor.id));
      if (successor) {
        await tx
          .update(groupMembers)
          .set({ role: "owner", updatedAt: new Date() })
          .where(eq(groupMembers.id, successor.id));
        await activity(tx, groupId, actor.id, "ownershipTransferred", successor.id);
      } else {
        await tx.update(groups).set({ archivedAt: new Date() }).where(eq(groups.id, groupId));
      }
    }
    await tx
      .update(groupMembers)
      .set({ status: "left", updatedAt: new Date() })
      .where(eq(groupMembers.id, actor.id));
    await activity(tx, groupId, actor.id, "left", actor.id);
    return { id: actor.id };
  }
  owner(actor);
  if (op.type === "categoryTree") {
    if (op.expectedRevision !== group.revision)
      throw new GroupError("Categories changed. Reload and review your draft before saving.", 409);
    return saveCategoryTree(tx, groupId, actor.id, op.draft);
  }
  if (op.type === "defaults") return saveSplitDefaults(tx, groupId, actor.id, members, op);
  if (op.type === "budget") {
    const categories = await tx
      .select()
      .from(groupCategories)
      .where(eq(groupCategories.groupId, groupId));
    if (Object.keys(op.allocations).some((id) => !categories.some((c) => c.id === id)))
      throw new GroupError("Invalid group category.");
    const [budget] = await tx
      .insert(groupBudgets)
      .values({ groupId, month: op.month, poolCents: op.poolCents })
      .onConflictDoUpdate({
        target: [groupBudgets.groupId, groupBudgets.month],
        set: { poolCents: op.poolCents, updatedAt: new Date() },
      })
      .returning();
    const before = await tx
      .select()
      .from(groupBudgetAllocations)
      .where(eq(groupBudgetAllocations.budgetId, budget.id));
    await tx.delete(groupBudgetAllocations).where(eq(groupBudgetAllocations.budgetId, budget.id));
    if (Object.keys(op.allocations).length)
      await tx.insert(groupBudgetAllocations).values(
        Object.entries(op.allocations).map(([categoryId, amountCents]) => ({
          budgetId: budget.id,
          categoryId,
          amountCents,
        })),
      );
    await activity(tx, groupId, actor.id, "budgetChanged", budget.id, { before, after: op });
    return { id: budget.id };
  }
  if (op.type === "category") {
    const categories = await tx
      .select()
      .from(groupCategories)
      .where(eq(groupCategories.groupId, groupId));
    if (op.id && !categories.some((c) => c.id === op.id))
      throw new GroupError("Category unavailable.", 404);
    if (!op.id && (categories.filter((c) => !c.archived).length >= 100 || categories.length >= 500))
      throw new GroupError("Maximum 100 group categories.");
    if (
      categories.some(
        (c) => c.id !== op.id && !c.archived && c.name.toLowerCase() === op.name.toLowerCase(),
      )
    )
      throw new GroupError("A category already has this name.");
    const existing = categories.find((c) => c.id === op.id);
    if (op.archived && categories.some((c) => c.parentId === op.id && !c.archived))
      throw new GroupError("Move or archive the subcategories before archiving their parent.");
    const values = {
      ...(existing?.parentId && !categories.some((c) => c.id === existing.parentId && !c.archived)
        ? { parentId: null }
        : {}),
      name: op.name,
      emoji: op.emoji,
      color: op.color,
      archived: op.archived,
      updatedAt: new Date(),
    };
    validateGroupCategoryNames(
      op.id
        ? categories.map((c) => (c.id === op.id ? { ...c, ...values } : c))
        : [...categories, { id: "new", parentId: null, ...values }],
    );
    const [row] = op.id
      ? await tx
          .update(groupCategories)
          .set(values)
          .where(eq(groupCategories.id, op.id))
          .returning()
      : await tx
          .insert(groupCategories)
          .values({ groupId, ...values })
          .returning();
    await activity(tx, groupId, actor.id, "categoryChanged", row.id, {
      before: categories.find((c) => c.id === op.id) ?? null,
      after: values,
    });
    return { id: row.id };
  }
  if (op.type === "invite") {
    if (
      op.reactivateMemberId &&
      !members.some((m) => m.id === op.reactivateMemberId && m.status !== "active" && m.userId)
    )
      throw new GroupError("Choose a former member.");
    const result = await issueInvite(tx, groupId, actor.id, op.reactivateMemberId);
    await activity(tx, groupId, actor.id, "invited", result.id);
    return result;
  }
  if (op.type === "revoke") {
    const [row] = await tx
      .update(groupInvites)
      .set({ revokedAt: new Date() })
      .where(and(eq(groupInvites.id, op.id), eq(groupInvites.groupId, groupId)))
      .returning();
    if (!row) throw new GroupError("Invitation unavailable.", 404);
    await activity(tx, groupId, actor.id, "inviteRevoked", row.id);
    return { id: row.id };
  }
  if (op.type === "remove" || op.type === "transfer") {
    const member = members.find((m) => m.id === op.id && m.status === "active");
    if (!member || member.id === actor.id || !member.userId)
      throw new GroupError("Choose another active member.");
    if (op.type === "transfer") {
      // Demote first to maintain the partial unique index for a single owner.
      await tx
        .update(groupMembers)
        .set({ role: "member", updatedAt: new Date() })
        .where(eq(groupMembers.id, actor.id));
      await tx
        .update(groupMembers)
        .set({ role: "owner", updatedAt: new Date() })
        .where(eq(groupMembers.id, member.id));
    } else {
      await tx
        .update(groupMembers)
        .set({ status: "removed", updatedAt: new Date() })
        .where(eq(groupMembers.id, member.id));
    }
    await activity(
      tx,
      groupId,
      actor.id,
      op.type === "remove" ? "removed" : "ownershipTransferred",
      member.id,
    );
    return { id: member.id };
  }
  if (op.type === "settings") {
    await tx
      .update(groups)
      .set({ name: op.name, archivedAt: op.archived ? new Date() : null })
      .where(eq(groups.id, groupId));
    await activity(tx, groupId, actor.id, "settingsChanged", groupId, {
      before: { name: group.name, archived: !!group.archivedAt },
      after: op,
    });
    return { id: groupId };
  }
  throw new GroupError("Unknown operation.");
}
