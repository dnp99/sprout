import { and, eq, inArray, sql } from "drizzle-orm";
import { groupCategories, groupEntries, groupBudgets, groupBudgetAllocations } from "@/db/schema";
import { activity, type GroupTx } from "./context";
import { MAX_CENTS, GroupError } from "./validation";
import { validateCategoryTree, type CategoryTreeDraft } from "./category-tree";

/** Called only after owner/revision/archive checks under the existing group write lock. */
export async function saveCategoryTree(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  draft: CategoryTreeDraft,
) {
  const before = await tx
    .select()
    .from(groupCategories)
    .where(eq(groupCategories.groupId, groupId));
  validateCategoryTree(before, draft);
  const fresh = draft.nodes.filter((n) => !before.some((c) => c.id === n.id));
  if (fresh.length) {
    const existing = await tx
      .select({ id: groupCategories.id })
      .from(groupCategories)
      .where(
        inArray(
          groupCategories.id,
          fresh.map((n) => n.id),
        ),
      );
    if (existing.length) throw new GroupError("A new category identifier is unavailable.");
    await tx.insert(groupCategories).values(fresh.map((n) => ({ ...n, groupId })));
  }
  for (const node of draft.nodes.filter((n) => before.some((c) => c.id === n.id)))
    await tx
      .update(groupCategories)
      .set({ ...node, updatedAt: new Date() })
      .where(eq(groupCategories.id, node.id));
  const remap = new Map(draft.merges.map((m) => [m.sourceId, m.targetId]));
  let affectedEntries = 0;
  for (const merge of draft.merges) {
    const affected = await tx
      .update(groupEntries)
      .set({
        categoryId: merge.targetId,
        version: sql`${groupEntries.version} + 1`,
        updatedAt: new Date(),
      })
      .where(and(eq(groupEntries.groupId, groupId), eq(groupEntries.categoryId, merge.sourceId)))
      .returning({ id: groupEntries.id });
    affectedEntries += affected.length;
    await tx
      .update(groupCategories)
      .set({ archived: true, parentId: null, updatedAt: new Date() })
      .where(eq(groupCategories.id, merge.sourceId));
  }
  if (draft.merges.length) {
    const budgets = await tx
      .select({ id: groupBudgets.id })
      .from(groupBudgets)
      .where(eq(groupBudgets.groupId, groupId));
    if (budgets.length) {
      const ids = budgets.map((b) => b.id),
        allocations = await tx
          .select()
          .from(groupBudgetAllocations)
          .where(inArray(groupBudgetAllocations.budgetId, ids));
      const merged = new Map<
        string,
        { budgetId: string; categoryId: string; amountCents: number }
      >();
      for (const row of allocations) {
        const categoryId = remap.get(row.categoryId) ?? row.categoryId,
          key = `${row.budgetId}:${categoryId}`,
          amountCents = (merged.get(key)?.amountCents ?? 0) + row.amountCents;
        if (!Number.isSafeInteger(amountCents) || amountCents > MAX_CENTS)
          throw new GroupError("Merged category budget is too large.");
        merged.set(key, { budgetId: row.budgetId, categoryId, amountCents });
      }
      await tx.delete(groupBudgetAllocations).where(inArray(groupBudgetAllocations.budgetId, ids));
      const values = [...merged.values()];
      for (let i = 0; i < values.length; i += 500)
        await tx.insert(groupBudgetAllocations).values(values.slice(i, i + 500));
    }
  }
  await activity(tx, groupId, actorId, "categoriesOrganized", null, {
    before,
    after: draft,
    affectedEntries,
  });
  return { id: groupId };
}
