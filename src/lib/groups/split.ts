import type {
  GroupSnapshot,
  GroupCategory,
  GroupEntry,
  GroupMember,
  GroupSplitResult,
  SplitSnapshot,
} from "./dto";
import { allocate, refundShares } from "./accounting";
import { GroupError } from "./validation";

export type SplitWeights = { memberId: string; weight: number }[];
export type CategorySplitRule = { categoryId: string; participants: SplitWeights };

/** Normalized category preferences are shared with import/copy/category tools. */
export function snapshotSplitRules(
  data: Pick<GroupSnapshot, "members" | "categorySplits" | "categorySplitRules">,
): CategorySplitRule[] {
  return (
    data.categorySplitRules ??
    (data.categorySplits ?? []).map((r) => ({
      categoryId: r.categoryId,
      participants: r.method === "equal" ? equalWeights(data.members) : r.participants,
    }))
  );
}

/** Exact integer percentages also give deterministic equal shares for 3+ members. */
export function equalWeights(members: Pick<GroupMember, "id" | "status">[]): SplitWeights {
  const active = members
    .filter((m) => m.status === "active")
    .map((m) => m.id)
    .sort();
  return active.map((memberId, i) => ({
    memberId,
    weight: Math.floor(10000 / active.length) + (i < 10000 % active.length ? 1 : 0),
  }));
}
export function validWeights(weights: SplitWeights, activeIds: string[]): boolean {
  return (
    weights.length === activeIds.length &&
    new Set(weights.map((p) => p.memberId)).size === weights.length &&
    weights.every(
      (p) =>
        activeIds.includes(p.memberId) &&
        Number.isInteger(p.weight) &&
        p.weight >= 0 &&
        p.weight <= 10000,
    ) &&
    weights.reduce((n, p) => n + p.weight, 0) === 10000
  );
}
export function sameWeights(a: SplitWeights, b: SplitWeights): boolean {
  return (
    a.length === b.length &&
    a.every((p) => b.some((q) => p.memberId === q.memberId && p.weight === q.weight))
  );
}
/** Resolve rather than copying inherited defaults, so later parent edits propagate. */
export function resolveWeights(
  categoryId: string | null,
  categories: GroupCategory[],
  rules: CategorySplitRule[],
  baseline: SplitWeights,
): SplitWeights {
  const category = categories.find((c) => c.id === categoryId);
  return (
    rules.find((r) => r.categoryId === categoryId)?.participants ??
    rules.find((r) => r.categoryId === category?.parentId)?.participants ??
    baseline
  );
}
/** Compress only against the immediate parent; a child matching the baseline may
 * still be an exception when its parent differs from that baseline. */
export function visibleRules(
  categories: GroupCategory[],
  rules: CategorySplitRule[],
  baseline: SplitWeights,
) {
  return categories
    .filter((c) => !c.archived)
    .filter((c) => {
      const effective = resolveWeights(c.id, categories, rules, baseline);
      const inherited = c.parentId
        ? resolveWeights(c.parentId, categories, rules, baseline)
        : baseline;
      return !sameWeights(effective, inherited);
    });
}
export function splitSnapshot(entry: GroupEntry, shares = entry.shares): SplitSnapshot {
  return {
    amountCents: entry.amountCents,
    categoryId: entry.categoryId,
    payerId: entry.payerId,
    occurredOn: entry.occurredOn,
    kind: entry.kind,
    settlement: entry.settlement,
    shares,
  };
}
/** Old pre-workspace allocations remain valid until an explicit recalculation. */
export function savedSplit(entry: GroupEntry): GroupSplitResult | null {
  return (
    entry.splitResult ??
    (entry.shares.length && entry.settlement && entry.payerId
      ? {
          snapshot: splitSnapshot(entry),
          review: "current",
          reviewedVersion: entry.version,
          calculatedAt: entry.updatedAt ?? `${entry.occurredOn}T00:00:00.000Z`,
        }
      : null)
  );
}
export function financialEdit(before: GroupEntry, after: SplitSnapshot): boolean {
  return (
    before.amountCents !== after.amountCents ||
    before.categoryId !== after.categoryId ||
    before.payerId !== after.payerId ||
    before.occurredOn !== after.occurredOn ||
    before.settlement !== after.settlement
  );
}
/** Balances use the saved financial snapshot, including its payer and amount,
 * while ordinary spending reports continue to read current original records. */
export function calculatedEntries(entries: GroupEntry[]): GroupEntry[] {
  return entries.flatMap((e) => {
    const saved = savedSplit(e);
    return saved && !e.voidedAt ? [{ ...e, ...saved.snapshot }] : [];
  });
}
export function splitEligible(e: GroupEntry): boolean {
  return !e.voidedAt && e.kind !== "income" && !!e.payerId;
}

/** Refunds share their original's allocation. Recompute the linked family as a
 * unit to preserve cent caps even when just the expense was selected. */
export function calculateSplit(
  entries: GroupEntry[],
  selected: string[],
  categories: GroupCategory[],
  rules: CategorySplitRule[],
  baseline: SplitWeights,
) {
  const wanted = new Set(selected);
  const expenses = entries.filter((e) => wanted.has(e.id) && e.kind === "expense");
  for (const e of entries.filter((e) => wanted.has(e.id) && e.refundOf)) {
    const original = entries.find((o) => o.id === e.refundOf && !o.voidedAt);
    if (!original) throw new GroupError("Original expense unavailable.");
    if (!expenses.some((o) => o.id === original.id)) expenses.push(original);
  }
  const results = new Map<string, SplitSnapshot>();
  for (const original of expenses) {
    if (!splitEligible(original) && !savedSplit(original))
      throw new GroupError("Choose eligible member-paid expenses.");
    const weights = resolveWeights(original.categoryId, categories, rules, baseline);
    // Explicitly recalculating a former member-paid expense now assigned to
    // shared funds removes its obligation without rewriting the original.
    const shares = original.payerId ? allocate(Math.abs(original.amountCents), weights) : [];
    results.set(original.id, {
      ...splitSnapshot(original, shares),
      settlement: !!original.payerId,
    });
    const refunds = entries
      .filter((e) => !e.voidedAt && e.refundOf === original.id)
      .sort((a, b) => a.occurredOn.localeCompare(b.occurredOn) || a.id.localeCompare(b.id));
    const prior: typeof shares = [];
    for (const refund of refunds) {
      const allocated = shares.length ? refundShares(refund.amountCents, shares, prior) : [];
      prior.push(...allocated);
      results.set(refund.id, {
        ...splitSnapshot(refund, allocated),
        settlement: !!original.payerId,
      });
    }
  }
  return results;
}
