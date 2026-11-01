import { readGroupRules } from "./merchant-rules";
import { normalizeMerchant } from "@/lib/import/normalize";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { groupCategories, groupMutations } from "@/db/schema";
import { categorizeMerchants } from "@/lib/import/ai-categorize";
import { groupContext, ledger } from "./context";
import { selectedGroupEntries } from "./bulk-plan";
import { groupCategoryAssignments } from "./ai-category-plan";
import { groupCategoryLabel } from "./category-tree";
import type { GroupBulkInput } from "./bulk-validation";
import { GroupError } from "./validation";

/** Authorize before sending merchants to AI; bulkGroup rechecks versions and
 * membership under its write lock so a slow AI call cannot overwrite an edit. */
export async function prepareGroupCategories(
  userId: string,
  groupId: string,
  input: GroupBulkInput,
) {
  const initial = await getDb().transaction(async (tx) => {
    const { group, actor } = await groupContext(tx, userId, groupId);
    const [receipt] = await tx
      .select()
      .from(groupMutations)
      .where(
        and(
          eq(groupMutations.groupId, groupId),
          eq(groupMutations.actorId, actor.id),
          eq(groupMutations.key, input.key),
        ),
      );
    if (receipt) return { entries: [], categories: [], rules: [] };
    if (group.archivedAt) throw new GroupError("Archived groups are read-only.", 409);
    if (group.revision !== input.revision)
      throw new GroupError("Reload this group and try again.", 409);
    const { entries } = await ledger(tx, groupId);
    return {
      rules: await readGroupRules(tx, groupId),
      entries: selectedGroupEntries(entries, input.entries),
      categories: await tx
        .select()
        .from(groupCategories)
        .where(eq(groupCategories.groupId, groupId)),
    };
  });
  const idByLabel = new Map(
    initial.categories
      .filter((c) => !c.archived)
      .map((c) => [groupCategoryLabel(initial.categories, c.id), c.id]),
  );
  const rules = new Map(initial.rules.map((r) => [r.pattern, r.categoryId]));
  const answers = await categorizeMerchants(
    [
      ...new Set(
        initial.entries
          .filter(
            (e) =>
              e.kind === "expense" && !e.categoryId && !rules.has(normalizeMerchant(e.merchant)),
          )
          .map((e) => e.merchant),
      ),
    ],
    [...idByLabel.keys()],
  );
  const ids = new Map<string, string>();
  for (const [merchant, label] of answers) {
    const id = idByLabel.get(label);
    if (id) ids.set(merchant, id);
  }
  for (const entry of initial.entries) {
    const categoryId = rules.get(normalizeMerchant(entry.merchant));
    if (categoryId) ids.set(entry.merchant, categoryId);
  }
  return groupCategoryAssignments(initial.entries, ids);
}
