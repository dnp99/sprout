import { and, eq } from "drizzle-orm";
import { groupMerchantRules, groupCategories } from "@/db/schema";
import { normalizeMerchant } from "@/lib/import/normalize";
import { activity, type GroupTx } from "./context";
import { GroupError, type GroupOperation } from "./validation";

/** Ignore archived destinations so deleting a category cannot silently revive it through a rule. */
export async function readGroupRules(tx: GroupTx, groupId: string) {
  return tx
    .select({
      id: groupMerchantRules.id,
      pattern: groupMerchantRules.pattern,
      label: groupMerchantRules.label,
      categoryId: groupMerchantRules.categoryId,
    })
    .from(groupMerchantRules)
    .innerJoin(
      groupCategories,
      and(
        eq(groupCategories.id, groupMerchantRules.categoryId),
        eq(groupCategories.groupId, groupId),
        eq(groupCategories.archived, false),
      ),
    )
    .where(eq(groupMerchantRules.groupId, groupId))
    .orderBy(groupMerchantRules.pattern);
}

/** All active members maintain the same shared rules under the outer revision lock. */
export async function applyGroupRule(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  op: Extract<GroupOperation, { type: "merchantRule" | "merchantRuleDelete" }>,
) {
  if (op.type === "merchantRuleDelete") {
    const [before] = await tx
      .delete(groupMerchantRules)
      .where(and(eq(groupMerchantRules.groupId, groupId), eq(groupMerchantRules.id, op.id)))
      .returning();
    if (!before) throw new GroupError("Rule unavailable.", 404);
    await activity(tx, groupId, actorId, "merchantRuleDeleted", before.id, { before });
    return { id: before.id };
  }
  const pattern = normalizeMerchant(op.merchant);
  if (!pattern) throw new GroupError("Enter a merchant name with letters.");
  const [category] = await tx
    .select()
    .from(groupCategories)
    .where(
      and(
        eq(groupCategories.id, op.categoryId),
        eq(groupCategories.groupId, groupId),
        eq(groupCategories.archived, false),
      ),
    );
  if (!category) throw new GroupError("Choose an active group category.");
  const [before] = await tx
    .select()
    .from(groupMerchantRules)
    .where(and(eq(groupMerchantRules.groupId, groupId), eq(groupMerchantRules.pattern, pattern)));
  if (op.id && before && before.id !== op.id)
    throw new GroupError("A rule already uses this merchant.", 409);
  const [existing] = op.id
    ? await tx
        .select()
        .from(groupMerchantRules)
        .where(and(eq(groupMerchantRules.groupId, groupId), eq(groupMerchantRules.id, op.id)))
    : [];
  if (op.id && !existing) throw new GroupError("Rule unavailable.", 404);
  const [rule] = op.id
    ? await tx
        .update(groupMerchantRules)
        .set({ pattern, label: op.merchant, categoryId: op.categoryId, updatedAt: new Date() })
        .where(and(eq(groupMerchantRules.groupId, groupId), eq(groupMerchantRules.id, op.id)))
        .returning()
    : await tx
        .insert(groupMerchantRules)
        .values({ groupId, pattern, label: op.merchant, categoryId: op.categoryId })
        .onConflictDoUpdate({
          target: [groupMerchantRules.groupId, groupMerchantRules.pattern],
          set: { label: op.merchant, categoryId: op.categoryId, updatedAt: new Date() },
        })
        .returning();
  await activity(tx, groupId, actorId, "merchantRuleChanged", rule.id, {
    before: existing ?? before ?? null,
    after: rule,
  });
  return { id: rule.id };
}
