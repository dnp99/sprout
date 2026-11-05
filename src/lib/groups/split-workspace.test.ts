import { describe, expect, it } from "vitest";
import { calculateSplit, splitSnapshot } from "./split";
import {
  canIncludeSplitEntry,
  splitChoiceKey,
  splitDecision,
  splitRecordStatus,
  splitWorkspaceFamilies,
} from "./split-workspace";
import type { GroupEntry } from "./dto";
const expense = (patch: Partial<GroupEntry> = {}): GroupEntry => ({
  id: "e",
  authorId: "a",
  payerId: "a",
  categoryId: null,
  kind: "expense",
  amountCents: -10001,
  merchant: "Maple Market",
  note: "",
  occurredOn: "2026-11-01",
  refundOf: null,
  settlement: true,
  splitMethod: "equal",
  version: 1,
  voidedAt: null,
  shares: [],
  ...patch,
});
const weights = [
  { memberId: "a", weight: 5000 },
  { memberId: "b", weight: 5000 },
];
const saved = (
  entry: GroupEntry,
  review: "current" | "pending" | "excluded" = "current",
): GroupEntry => ({
  ...entry,
  splitResult: {
    snapshot: splitSnapshot(entry),
    review,
    reviewedVersion: entry.version,
    calculatedAt: "2026-11-01T00:00:00Z",
  },
});
describe("split workspace eligibility and financial decisions", () => {
  it("does not let a member-paid refund admit an unsplit shared-fund original", () => {
    const original = expense({ payerId: null });
    const refund = expense({ id: "r", kind: "refund", amountCents: 500, refundOf: "e" });
    expect(splitWorkspaceFamilies([original, refund]).size).toBe(0);
    expect(canIncludeSplitEntry(refund, [original, refund])).toBe(false);
  });
  it("keeps calculated shared-fund families reviewable and removes their old debt only on calculation", () => {
    const original = { ...saved(expense(), "pending"), payerId: null };
    const refund = {
      ...saved(expense({ id: "r", kind: "refund", amountCents: 501, refundOf: "e" }), "pending"),
      payerId: null,
    };
    const rows = [original, refund];
    expect(splitWorkspaceFamilies(rows).size).toBe(2);
    expect(rows.every((e) => canIncludeSplitEntry(e, rows))).toBe(true);
    expect(calculateSplit(rows, ["e", "r"], [], [], weights).get("e")?.shares).toEqual([]);
    expect(original.splitResult?.snapshot.payerId).toBe("a");
  });
  it("requires a new family review after any financial version changes, ahead of previously kept edits", () => {
    const original = saved(expense(), "excluded");
    const refund = saved(
      expense({ id: "r", refundOf: "e", kind: "refund", amountCents: 100 }),
      "pending",
    );
    const family = [original, refund];
    expect(splitDecision(family)).toBe("");
    const choice = { key: splitChoiceKey(family), value: "include" as const };
    expect(splitDecision(family, choice)).toBe("include");
    expect(splitDecision([original, { ...refund, version: 2 }], choice)).toBe("");
    expect(splitRecordStatus(original)).toBe("kept");
  });
  it("excludes voided/income rows but keeps an orphan refund visible for actionable validation", () => {
    const refund = expense({ id: "r", kind: "refund", amountCents: 500, refundOf: "missing" });
    const entries = [
      expense({ voidedAt: "2026-11-02" }),
      expense({ id: "i", kind: "income" }),
      refund,
    ];
    expect([...splitWorkspaceFamilies(entries).keys()]).toEqual(["r"]);
    expect(canIncludeSplitEntry(refund, entries)).toBe(false);
  });
});
