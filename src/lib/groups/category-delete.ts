import { and, eq } from "drizzle-orm";
import {
  groupCategories,
  groupEntries,
  groupBudgetAllocations,
  groupRecurringItems,
} from "@/db/schema";
import { activity, ledger, type GroupTx } from "./context";
import { GroupError } from "./validation";
import { reviewSplitEdit } from "./split-edits";
import { splitSnapshot } from "./split";

/** Retain category identity for historical calculation snapshots; only its active
 * availability and current assignments are removed. Financial records survive. */
export async function deleteGroupCategory(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  id: string,
) {
  const [category] = await tx
    .select()
    .from(groupCategories)
    .where(and(eq(groupCategories.groupId, groupId), eq(groupCategories.id, id)));
  if (!category || category.archived) throw new GroupError("Category unavailable.", 404);
  const { entries } = await ledger(tx, groupId);
  for (const entry of entries.filter((e) => e.categoryId === id && !e.voidedAt)) {
    await reviewSplitEdit(tx, groupId, entry, { ...splitSnapshot(entry), categoryId: null });
    await tx
      .update(groupEntries)
      .set({ categoryId: null, version: entry.version + 1, updatedAt: new Date() })
      .where(eq(groupEntries.id, entry.id));
  }
  await tx
    .update(groupCategories)
    .set({ parentId: null, updatedAt: new Date() })
    .where(and(eq(groupCategories.groupId, groupId), eq(groupCategories.parentId, id)));
  await tx
    .update(groupRecurringItems)
    .set({ categoryId: null })
    .where(and(eq(groupRecurringItems.groupId, groupId), eq(groupRecurringItems.categoryId, id)));
  await tx.delete(groupBudgetAllocations).where(eq(groupBudgetAllocations.categoryId, id));
  await tx
    .update(groupCategories)
    .set({ archived: true, parentId: null, updatedAt: new Date() })
    .where(eq(groupCategories.id, id));
  await activity(tx, groupId, actorId, "categoryDeleted", id, { before: category });
  return { id };
}
