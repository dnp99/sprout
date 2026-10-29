import { groupCategoryLabel } from "./category-tree";
import type { GroupCategory, GroupEntry, GroupSnapshot } from "./dto";
import type { BulkAction, GroupSelection } from "./bulk-validation";
import { GroupError } from "./validation";
import { allocate, refundShares } from "./accounting";
import { resolveGroupSplit } from "./splits";

/** Verify the exact reviewed versions against the complete authorized ledger. */
export function selectedGroupEntries(all: GroupEntry[], selection: GroupSelection) {
  return selection.map((s) => {
    const entry = all.find((e) => e.id === s.id && !e.voidedAt);
    if (!entry || entry.version !== s.version)
      throw new GroupError(
        "A selected record changed or is unavailable. Reload and reselect it.",
        409,
      );
    return entry;
  });
}
/** Validate the final family state once so moving an expense and refunds together is atomic. */
export function checkBulkEdit(
  all: GroupEntry[],
  selected: GroupEntry[],
  action: Extract<BulkAction, { action: "date" | "category" | "delete" }>,
) {
  const ids = new Set(selected.map((e) => e.id));
  for (const refund of all.filter((e) => !e.voidedAt && e.refundOf)) {
    const original = all.find((e) => e.id === refund.refundOf && !e.voidedAt);
    if (!original || (!ids.has(original.id) && !ids.has(refund.id))) continue;
    if (action.action === "delete") {
      if (ids.has(original.id) && !ids.has(refund.id))
        throw new GroupError("Select all linked refunds before deleting the original expense.");
    } else if (action.action === "category") {
      if (ids.has(original.id) !== ids.has(refund.id))
        throw new GroupError(
          "Change the category of the original expense and all linked refunds together.",
        );
    } else {
      const originalDate = ids.has(original.id) ? action.occurredOn : original.occurredOn;
      const refundDate = ids.has(refund.id) ? action.occurredOn : refund.occurredOn;
      if (refundDate < originalDate)
        throw new GroupError(
          "A refund cannot precede its original expense. Select linked records together.",
        );
    }
  }
}
const categoryKey = (name: string) => name.normalize("NFKC").trim().toLowerCase();
/** Copy uses destination identities/defaults, never source membership IDs or source debt. */
export function planGroupCopy(
  selected: GroupEntry[],
  sourceCategories: GroupCategory[],
  target: Pick<GroupSnapshot, "categories" | "splitDefaults" | "categorySplits">,
  options: { payerId: string | null; settlement: boolean },
  newId: () => string,
) {
  const ids = new Map(selected.map((e) => [e.id, newId()]));
  const categories = new Map(
    target.categories.filter((c) => !c.archived).map((c) => [categoryKey(c.name), c.id]),
  );
  const paths = new Map(
    target.categories
      .filter((c) => !c.archived)
      .map((c) => [categoryKey(groupCategoryLabel(target.categories, c.id)), c.id]),
  );
  const planned: GroupEntry[] = [];
  const ordered = [...selected].sort(
    (a, b) =>
      Number(a.kind === "refund") - Number(b.kind === "refund") ||
      a.occurredOn.localeCompare(b.occurredOn) ||
      a.id.localeCompare(b.id),
  );
  for (const entry of ordered) {
    const categoryName = sourceCategories.find((c) => c.id === entry.categoryId)?.name;
    let categoryId = categoryName
      ? (paths.get(categoryKey(groupCategoryLabel(sourceCategories, entry.categoryId))) ??
        categories.get(categoryKey(categoryName)) ??
        null)
      : null;
    const split = resolveGroupSplit(target, categoryId);
    let shares: GroupEntry["shares"] = [],
      settlement = options.settlement && options.payerId !== null && entry.kind === "expense",
      splitMethod = split.method;
    let refundOf: string | null = null;
    if (entry.kind === "expense") {
      if (!split.valid)
        throw new GroupError(
          "Review the destination group's category or default split before copying.",
          409,
        );
      shares = allocate(Math.abs(entry.amountCents), split.participants);
    } else if (entry.kind === "refund") {
      const original = planned.find((e) => e.id === ids.get(entry.refundOf ?? ""));
      if (!original || original.kind !== "expense")
        throw new GroupError("Copy refunds together with their original expense.");
      refundOf = original.id;
      categoryId = original.categoryId;
      settlement = original.settlement;
      splitMethod = original.splitMethod;
      const prior = planned.filter((e) => e.refundOf === original.id);
      if (
        entry.occurredOn < original.occurredOn ||
        prior.reduce((n, e) => n + e.amountCents, 0) + entry.amountCents >
          Math.abs(original.amountCents)
      )
        throw new GroupError("Invalid linked refund.");
      shares = refundShares(
        entry.amountCents,
        original.shares,
        prior.flatMap((e) => e.shares),
      );
    } else if (entry.kind !== "income") throw new GroupError("Unsupported record type.");
    planned.push({
      ...entry,
      id: ids.get(entry.id)!,
      payerId: options.payerId,
      categoryId,
      refundOf,
      settlement,
      splitMethod,
      shares,
      version: 0,
      voidedAt: null,
      updatedAt: undefined,
    });
  }
  return planned;
}
