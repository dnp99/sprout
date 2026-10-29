import { and, eq } from "drizzle-orm";
import {
  groups,
  groupCategories,
  groupSplitDefaults,
  groupCategorySplits,
  groupCategorySplitWeights,
} from "@/db/schema";
import { activity, type GroupTx, type MemberRow } from "./context";
import { GroupError, type GroupOperation } from "./validation";
import { splitDefault } from "./splits";

/** Called under the authorized group lock, sharing resolution between drafts and imports. */
export async function readSplitDefaults(
  tx: GroupTx,
  groupId: string,
  method: string,
  members: MemberRow[],
) {
  const defaults = await tx
    .select()
    .from(groupSplitDefaults)
    .where(eq(groupSplitDefaults.groupId, groupId));
  const rules = await tx
    .select()
    .from(groupCategorySplits)
    .where(eq(groupCategorySplits.groupId, groupId));
  const weights = await tx
    .select({
      categoryId: groupCategorySplitWeights.categoryId,
      memberId: groupCategorySplitWeights.memberId,
      weight: groupCategorySplitWeights.weight,
    })
    .from(groupCategorySplitWeights)
    .innerJoin(
      groupCategorySplits,
      eq(groupCategorySplits.categoryId, groupCategorySplitWeights.categoryId),
    )
    .where(eq(groupCategorySplits.groupId, groupId));
  return {
    splitDefaults: splitDefault(
      method,
      defaults.map(({ memberId, weight }) => ({ memberId, weight })),
      members,
    ),
    categorySplits: rules.map((r) => ({
      categoryId: r.categoryId,
      ...splitDefault(
        r.method,
        weights
          .filter((w) => w.categoryId === r.categoryId)
          .map(({ memberId, weight }) => ({ memberId, weight })),
        members,
      ),
    })),
  };
}
/** Owner authorization is performed by applyOperation; category ownership is checked here. */
export async function saveSplitDefaults(
  tx: GroupTx,
  groupId: string,
  actorId: string,
  members: MemberRow[],
  op: Extract<GroupOperation, { type: "defaults" }>,
) {
  if (op.categoryId) {
    const [category] = await tx
      .select()
      .from(groupCategories)
      .where(
        and(
          eq(groupCategories.groupId, groupId),
          eq(groupCategories.id, op.categoryId),
          eq(groupCategories.archived, false),
        ),
      );
    if (!category) throw new GroupError("Choose an active group category.");
  } else if (op.method === "inherit")
    throw new GroupError("Choose a category to inherit the group split.");
  if (op.method !== "inherit" && !splitDefault(op.method, op.participants, members).valid)
    throw new GroupError("Assign percentages to every active member totaling 100%.");
  if (op.categoryId) {
    await tx.delete(groupCategorySplits).where(eq(groupCategorySplits.categoryId, op.categoryId));
    if (op.method !== "inherit") {
      await tx
        .insert(groupCategorySplits)
        .values({ groupId, categoryId: op.categoryId, method: op.method });
      if (op.method === "percentage")
        await tx
          .insert(groupCategorySplitWeights)
          .values(op.participants.map((p) => ({ ...p, categoryId: op.categoryId! })));
    }
  } else {
    await tx.delete(groupSplitDefaults).where(eq(groupSplitDefaults.groupId, groupId));
    if (op.method === "percentage")
      await tx.insert(groupSplitDefaults).values(op.participants.map((p) => ({ ...p, groupId })));
    await tx.update(groups).set({ splitMethod: op.method }).where(eq(groups.id, groupId));
  }
  await activity(tx, groupId, actorId, "defaultsChanged", op.categoryId ?? groupId, { after: op });
  return { id: op.categoryId ?? groupId };
}
