import { eq } from "drizzle-orm";
import {
  groupCategories,
  groupCategorySplits,
  groupCategorySplitWeights,
  groupMembers,
  groupSplitDefaults,
  groupSplitResults,
  groups,
} from "@/db/schema";
import { activity, ledger, owner, type GroupTx, type MemberRow } from "./context";
import { readSplitDefaults } from "./split-repository";
import { GroupError, type GroupOperation } from "./validation";
import { calculateSplit, equalWeights, savedSplit, splitEligible, validWeights } from "./split";

/** Called inside the existing group revision lock/idempotency transaction. */
export async function applySplitOperation(
  tx: GroupTx,
  group: typeof groups.$inferSelect,
  actor: MemberRow,
  op: Extract<GroupOperation, { type: "split" | "splitRules" }>,
) {
  const groupId = group.id;
  const members = await tx.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
  const categories = await tx
    .select()
    .from(groupCategories)
    .where(eq(groupCategories.groupId, groupId));
  const activeIds = members.filter((m) => m.status === "active").map((m) => m.id);
  if (op.type === "splitRules") {
    owner(actor);
    if (
      !validWeights(op.participants, activeIds) ||
      op.categories.some(
        (c) =>
          !validWeights(c.participants, activeIds) ||
          !categories.some((r) => r.id === c.categoryId),
      )
    )
      throw new GroupError("Choose group categories and percentages for every active member.");
    await tx.delete(groupSplitDefaults).where(eq(groupSplitDefaults.groupId, groupId));
    await tx.insert(groupSplitDefaults).values(op.participants.map((p) => ({ ...p, groupId })));
    await tx.update(groups).set({ splitMethod: "percentage" }).where(eq(groups.id, groupId));
    await tx.delete(groupCategorySplits).where(eq(groupCategorySplits.groupId, groupId));
    for (const rule of op.categories) {
      await tx
        .insert(groupCategorySplits)
        .values({ groupId, categoryId: rule.categoryId, method: "percentage" });
      await tx
        .insert(groupCategorySplitWeights)
        .values(rule.participants.map((p) => ({ ...p, categoryId: rule.categoryId })));
    }
    await activity(tx, groupId, actor.id, "splitRulesChanged", groupId, { after: op });
    return { id: groupId };
  }
  const { entries } = await ledger(tx, groupId);
  for (const choice of op.entries) {
    const entry = entries.find((e) => e.id === choice.id && !e.voidedAt);
    if (!entry || entry.version !== choice.version)
      throw new GroupError("A selected record changed. Reload and review.", 409);
    if (
      choice.decision === "include" &&
      !splitEligible(entry) &&
      !(entry.kind === "expense" && savedSplit(entry))
    )
      throw new GroupError("Choose eligible member-paid expenses or refunds.");
    if (choice.decision === "exclude" && !savedSplit(entry))
      throw new GroupError("Only calculated records can retain a previous result.");
  }
  const defaults = await readSplitDefaults(tx, groupId, group.splitMethod, members);
  const baseline =
    group.splitMethod === "equal" ? equalWeights(members) : defaults.splitDefaults.participants;
  const rules = defaults.categorySplits.map((r) => ({
    categoryId: r.categoryId,
    participants: r.method === "equal" ? equalWeights(members) : r.participants,
  }));
  const included = op.entries.filter((e) => e.decision === "include").map((e) => e.id);
  const needed = entries.filter((e) => included.includes(e.id));
  const familyIds = new Set(needed.map((e) => e.refundOf ?? e.id));
  const affected = entries.filter(
    (e) => !e.voidedAt && (familyIds.has(e.id) || (!!e.refundOf && familyIds.has(e.refundOf))),
  );
  if (
    included.length &&
    (!validWeights(baseline, activeIds) ||
      affected.some((e) => {
        const rule =
          rules.find((r) => r.categoryId === e.categoryId) ??
          rules.find(
            (r) => r.categoryId === categories.find((c) => c.id === e.categoryId)?.parentId,
          );
        return rule && !validWeights(rule.participants, activeIds);
      }))
  )
    throw new GroupError("Membership changed. Save valid split percentages first.");
  // Review cannot be bypassed by selecting a linked refund or its parent alone.
  for (const e of affected) {
    const saved = savedSplit(e);
    if (saved && saved.review !== "current" && !included.includes(e.id))
      throw new GroupError("Review linked expenses and refunds together before recalculating.");
    if (op.entries.some((c) => c.id === e.id && c.decision === "exclude"))
      throw new GroupError("Keep or recalculate linked expenses and refunds together.");
  }
  const results = calculateSplit(entries, included, categories, rules, baseline);
  const before = op.entries.map((c) => ({
    id: c.id,
    result: savedSplit(entries.find((e) => e.id === c.id)!),
  }));
  for (const choice of op.entries.filter((e) => e.decision === "exclude")) {
    const entry = entries.find((e) => e.id === choice.id)!;
    const saved = savedSplit(entry)!;
    if (saved.review === "current") continue;
    await tx
      .insert(groupSplitResults)
      .values({
        entryId: entry.id,
        groupId,
        snapshot: saved.snapshot,
        review: "excluded",
        reviewedVersion: entry.version,
        calculatedAt: new Date(saved.calculatedAt),
      })
      .onConflictDoUpdate({
        target: groupSplitResults.entryId,
        set: { review: "excluded", reviewedVersion: entry.version },
      });
  }
  for (const [entryId, snapshot] of results) {
    const entry = entries.find((e) => e.id === entryId)!;
    const values = {
      snapshot,
      review: "current",
      reviewedVersion: entry.version,
      calculatedAt: new Date(),
    };
    await tx
      .insert(groupSplitResults)
      .values({ entryId, groupId, ...values })
      .onConflictDoUpdate({ target: groupSplitResults.entryId, set: values });
  }
  await activity(tx, groupId, actor.id, "splitCalculated", groupId, {
    before,
    after: [...results].map(([id, snapshot]) => ({ id, snapshot })),
    decisions: op.entries,
  });
  return { id: groupId };
}
