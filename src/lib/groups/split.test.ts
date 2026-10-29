import { describe, expect, it } from "vitest";
import { allocate, balances } from "./accounting";
import {
  calculateSplit,
  calculatedEntries,
  equalWeights,
  financialEdit,
  resolveWeights,
  savedSplit,
  splitSnapshot,
  validWeights,
  visibleRules,
} from "./split";
import { inSplitRanges, monthRange, weekRange } from "./split-range";
import type { GroupCategory, GroupEntry } from "./dto";
const baseline = [
  { memberId: "a", weight: 4000 },
  { memberId: "b", weight: 6000 },
];
const half = baseline.map((p) => ({ ...p, weight: 5000 }));
const categories: GroupCategory[] = [
  { id: "grocery", name: "Grocery", emoji: "", color: "", archived: false },
  { id: "food", parentId: "grocery", name: "Food", emoji: "", color: "", archived: false },
  { id: "drink", parentId: "grocery", name: "Drink", emoji: "", color: "", archived: false },
];
function entry(patch: Partial<GroupEntry> = {}): GroupEntry {
  return {
    id: "e",
    authorId: "a",
    payerId: "a",
    categoryId: "food",
    kind: "expense",
    amountCents: -101,
    merchant: "Test",
    note: "",
    occurredOn: "2026-10-15",
    refundOf: null,
    settlement: true,
    splitMethod: "equal",
    version: 0,
    voidedAt: null,
    shares: [],
    ...patch,
  };
}
describe("hierarchical split rules", () => {
  it("omits matching parent/child rows but preserves an exception matching the group baseline", () => {
    expect(visibleRules(categories, [], baseline)).toEqual([]);
    const rules = [
      { categoryId: "grocery", participants: half },
      { categoryId: "drink", participants: half },
    ];
    expect(resolveWeights("food", categories, rules, baseline)).toEqual(half);
    expect(visibleRules(categories, rules, baseline).map((c) => c.id)).toEqual(["grocery"]);
    rules.push({ categoryId: "food", participants: baseline });
    expect(visibleRules(categories, rules, baseline).map((c) => c.id)).toEqual(["grocery", "food"]);
  });
  it("supports 100/0, exact equal totals, and rejects stale membership", () => {
    const all = [
      { memberId: "a", weight: 10000 },
      { memberId: "b", weight: 0 },
    ];
    expect(validWeights(all, ["a", "b"])).toBe(true);
    expect(validWeights(all, ["a", "b", "c"])).toBe(false);
    expect(
      equalWeights(["a", "b", "c"].map((id) => ({ id, status: "active" }))).reduce(
        (n, p) => n + p.weight,
        0,
      ),
    ).toBe(10000);
    expect(allocate(101, all).map((s) => s.amountCents)).toEqual([101, 0]);
  });
});
describe("independent calculation snapshots", () => {
  it("replaces repeated results without modifying original records or repayments", () => {
    const original = entry();
    const computed = calculateSplit([original], [original.id], categories, [], baseline);
    const saved = {
      ...original,
      splitResult: {
        snapshot: computed.get(original.id)!,
        review: "excluded" as const,
        reviewedVersion: 0,
        calculatedAt: "2026-10-15",
      },
    };
    const changed = { ...saved, amountCents: -900, payerId: "b" };
    expect(financialEdit(saved, splitSnapshot(changed))).toBe(true);
    expect(balances(calculatedEntries([changed]), [])).toEqual({ a: 61, b: -61 });
    const next = calculateSplit([changed], [changed.id], categories, [], half).get(changed.id)!;
    expect(next.shares.reduce((n, s) => n + s.amountCents, 0)).toBe(900);
    expect(calculateSplit([changed], [changed.id], categories, [], half).get(changed.id)).toEqual(
      next,
    );
    expect(original.shares).toEqual([]);
    expect(savedSplit(original)).toBeNull();
  });
  it("recalculates linked refunds once and conserves odd cents across partial refunds", () => {
    const original = entry({ amountCents: -3 });
    const refunds = [
      entry({ id: "r1", kind: "refund", amountCents: 1, refundOf: "e" }),
      entry({ id: "r2", kind: "refund", amountCents: 2, refundOf: "e" }),
    ];
    const result = calculateSplit([original, ...refunds], ["r2", "e", "r1"], categories, [], half);
    expect(result.size).toBe(3);
    const rows = [original, ...refunds].map((e) => ({
      ...e,
      splitResult: {
        snapshot: result.get(e.id)!,
        review: "current" as const,
        reviewedVersion: 0,
        calculatedAt: "",
      },
    }));
    expect(Object.values(balances(calculatedEntries(rows), [])).every((n) => n === 0)).toBe(true);
  });
});
describe("period boundaries", () => {
  it("uses inclusive months/weeks across leap days, year boundaries and DST", () => {
    expect(monthRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" });
    expect(weekRange("2026-01-01")).toEqual({ from: "2025-12-29", to: "2026-01-04" });
    expect(weekRange("2026-03-08")).toEqual({ from: "2026-03-02", to: "2026-03-08" });
    const ranges = [monthRange("2026-08"), monthRange("2026-10")];
    expect(inSplitRanges("2026-09-01", ranges)).toBe(false);
    expect(inSplitRanges("2026-10-31", ranges)).toBe(true);
  });
});
