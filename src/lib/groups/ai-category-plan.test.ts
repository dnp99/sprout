import { expect, it } from "vitest";
import type { GroupEntry } from "./dto";
import { groupCategoryCandidates, groupCategoryAssignments } from "./ai-category-plan";
const entry = (patch: Partial<GroupEntry> = {}): GroupEntry => ({
  id: "expense",
  authorId: "member",
  payerId: "member",
  categoryId: null,
  kind: "expense",
  amountCents: -1000,
  merchant: "Maple Market",
  note: "",
  occurredOn: "2026-10-01",
  refundOf: null,
  settlement: true,
  splitMethod: "equal",
  version: 1,
  voidedAt: null,
  shares: [],
  ...patch,
});
it("preserves manual categories and skips income, voids, blank merchants and orphan refunds", () => {
  expect(
    groupCategoryCandidates([
      entry(),
      entry({ id: "manual", categoryId: "food" }),
      entry({ id: "income", kind: "income" }),
      entry({ id: "void", voidedAt: "2026-10-02" }),
      entry({ id: "blank", merchant: " " }),
      entry({ id: "orphan", kind: "refund", refundOf: "missing" }),
    ]).map((e) => e.id),
  ).toEqual(["expense"]);
});
it("keeps refund families atomic within the limit and uses the original merchant's answer", () => {
  const family = [
    entry(),
    entry({ id: "refund", kind: "refund", refundOf: "expense", merchant: "Refund" }),
  ];
  expect(groupCategoryCandidates(family, 1)).toEqual([]);
  expect(groupCategoryCandidates(family, 2)).toHaveLength(2);
  expect([
    ...groupCategoryAssignments(
      family,
      new Map([
        ["Maple Market", "food"],
        ["Refund", "other"],
      ]),
    ),
  ]).toEqual([
    ["expense", "food"],
    ["refund", "food"],
  ]);
  expect(groupCategoryCandidates([family[0], { ...family[1], categoryId: "manual" }])).toEqual([]);
  expect(groupCategoryAssignments(family, new Map()).size).toBe(0);
});
