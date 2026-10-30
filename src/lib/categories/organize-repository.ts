import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, transactions, merchantRules, recurringItems } from "@/db/schema";
import { lockUser } from "@/lib/groups/context";
import { GroupError, MAX_CENTS } from "@/lib/groups/validation";
import { validateCategoryTree, type CategoryTreeDraft } from "@/lib/groups/category-tree";
import { categoryRevision, uncategorizedByMove } from "./tree-policy";

/** The personal tree uses independent IDs/budgets; sharing the organizer never
 * grants access to a group's categories or financial records. */
export async function organizeCategories(
  userId: string,
  draft: CategoryTreeDraft,
  expectedRevision: number,
) {
  return getDb().transaction(async (tx) => {
    await lockUser(tx, userId);
    const before = await tx
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .for("update");
    if (categoryRevision(before) !== expectedRevision)
      throw new GroupError("Categories changed. Reload before saving.", 409);
    const current = before.map((c) => ({ ...c, archived: false }));
    validateCategoryTree(current, draft);
    const rows = await tx
      .select({ categoryId: transactions.categoryId })
      .from(transactions)
      .where(eq(transactions.userId, userId));
    const counts: Record<string, number> = {};
    for (const row of rows)
      if (row.categoryId) counts[row.categoryId] = (counts[row.categoryId] ?? 0) + 1;
    const clear = uncategorizedByMove(current, draft, counts);
    if (clear.size)
      await tx
        .update(transactions)
        .set({ categoryId: null, updatedAt: new Date() })
        .where(and(eq(transactions.userId, userId), inArray(transactions.categoryId, [...clear])));
    const fresh = draft.nodes.filter((n) => !before.some((c) => c.id === n.id));
    if (fresh.length) {
      const conflicts = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(
          inArray(
            categories.id,
            fresh.map((n) => n.id),
          ),
        );
      if (conflicts.length) throw new GroupError("Category identifier unavailable.");
      await tx
        .insert(categories)
        .values(fresh.map((n) => ({ ...n, userId, monthlyBudgetCents: 0 })));
    }
    const budgets = new Map(before.map((c) => [c.id, c.monthlyBudgetCents]));
    for (const merge of draft.merges) {
      const total = (budgets.get(merge.targetId) ?? 0) + (budgets.get(merge.sourceId) ?? 0);
      if (total > MAX_CENTS) throw new GroupError("Merged budget is too large.");
      budgets.set(merge.targetId, total);
      await tx
        .update(transactions)
        .set({ categoryId: merge.targetId, updatedAt: new Date() })
        .where(and(eq(transactions.userId, userId), eq(transactions.categoryId, merge.sourceId)));
      await tx
        .update(merchantRules)
        .set({ categoryId: merge.targetId })
        .where(and(eq(merchantRules.userId, userId), eq(merchantRules.categoryId, merge.sourceId)));
      await tx
        .update(recurringItems)
        .set({ categoryId: merge.targetId })
        .where(
          and(eq(recurringItems.userId, userId), eq(recurringItems.categoryId, merge.sourceId)),
        );
    }
    for (const [sortOrder, node] of draft.nodes.entries())
      await tx
        .update(categories)
        .set({
          ...node,
          sortOrder,
          monthlyBudgetCents: budgets.get(node.id) ?? 0,
          updatedAt: new Date(),
        })
        .where(and(eq(categories.userId, userId), eq(categories.id, node.id)));
    if (draft.merges.length)
      await tx.delete(categories).where(
        and(
          eq(categories.userId, userId),
          inArray(
            categories.id,
            draft.merges.map((m) => m.sourceId),
          ),
        ),
      );
    return { ok: true };
  });
}
