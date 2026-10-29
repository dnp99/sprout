import { expect, it } from "vitest";
import type { GroupEntry } from "./dto";
import { checkBulkEdit, planGroupCopy, selectedGroupEntries } from "./bulk-plan";
import { parseGroupBulk, MAX_GROUP_BULK } from "./bulk-validation";
const uuid = "11111111-1111-4111-8111-111111111111";
const entry = (patch: Partial<GroupEntry> = {}): GroupEntry => ({
  id: "expense",
  authorId: "source-author",
  payerId: "source-payer",
  categoryId: "source-food",
  kind: "expense",
  amountCents: -10001,
  merchant: "Market",
  note: "Note",
  occurredOn: "2026-10-01",
  refundOf: null,
  settlement: true,
  splitMethod: "equal",
  version: 2,
  voidedAt: null,
  shares: [{ memberId: "source-member", amountCents: 10001, weight: 1 }],
  ...patch,
});
const expense = entry(),
  refund = entry({
    id: "refund",
    kind: "refund",
    amountCents: 1000,
    occurredOn: "2026-10-02",
    refundOf: expense.id,
  });
const category = {
  id: "target-food",
  name: "Groceries",
  emoji: "🛒",
  color: "#123456",
  archived: false,
};
const target = {
  categories: [category],
  splitDefaults: {
    method: "equal",
    valid: true,
    participants: [
      { memberId: "target-a", weight: 1 },
      { memberId: "target-b", weight: 1 },
    ],
  },
  categorySplits: [
    {
      categoryId: category.id,
      method: "percentage",
      valid: true,
      participants: [
        { memberId: "target-a", weight: 7500 },
        { memberId: "target-b", weight: 2500 },
      ],
    },
  ],
};
const sources = [{ ...category, id: "source-food", name: " GROCERIES " }];
it("checks reviewed versions and rejects missing, foreign or voided selections", () => {
  expect(selectedGroupEntries([expense], [{ id: expense.id, version: 2 }])).toEqual([expense]);
  for (const selection of [[{ id: expense.id, version: 1 }], [{ id: "foreign", version: 2 }]])
    expect(() => selectedGroupEntries([expense], selection)).toThrow();
  expect(() =>
    selectedGroupEntries([entry({ voidedAt: "2026-10-02" })], [{ id: expense.id, version: 2 }]),
  ).toThrow();
});
it("validates final dates and requires complete linked families for category/delete", () => {
  const all = [expense, refund];
  expect(() =>
    checkBulkEdit(all, [expense], { action: "date", occurredOn: "2026-10-03" }),
  ).toThrow();
  expect(() =>
    checkBulkEdit(all, [refund], { action: "date", occurredOn: "2026-09-30" }),
  ).toThrow();
  expect(() => checkBulkEdit(all, all, { action: "date", occurredOn: "2026-10-03" })).not.toThrow();
  expect(() => checkBulkEdit(all, [expense], { action: "category", categoryId: null })).toThrow();
  expect(() => checkBulkEdit(all, [refund], { action: "category", categoryId: null })).toThrow();
  expect(() => checkBulkEdit(all, all, { action: "category", categoryId: null })).not.toThrow();
  expect(() => checkBulkEdit(all, [expense], { action: "delete", reason: "Duplicate" })).toThrow();
  expect(() =>
    checkBulkEdit(all, [refund], { action: "delete", reason: "Duplicate" }),
  ).not.toThrow();
  expect(() => checkBulkEdit(all, all, { action: "delete", reason: "Duplicate" })).not.toThrow();
});
it("copies original records into destination identities without copying or calculating debt", () => {
  const original = structuredClone(expense);
  const copied = planGroupCopy(
    [expense],
    sources,
    target,
    { payerId: "target-payer", settlement: true },
    () => "new-expense",
  )[0];
  expect(copied).toMatchObject({
    id: "new-expense",
    categoryId: "target-food",
    payerId: "target-payer",
    version: 0,
    splitMethod: "equal",
  });
  expect(copied.shares).toEqual([]);
  expect(copied.splitResult).toBeNull();
  expect(expense).toEqual(original);
  const shared = planGroupCopy(
    [expense],
    [],
    target,
    { payerId: null, settlement: true },
    () => "new",
  )[0];
  expect(shared.categoryId).toBeNull();
  expect(shared.settlement).toBe(false);
  expect(shared.shares).toEqual([]);
});
it("copies refund links without allocations; standalone refunds fail", () => {
  let id = 0;
  const rows = planGroupCopy(
    [refund, expense],
    sources,
    target,
    { payerId: "target-payer", settlement: true },
    () => `copy-${++id}`,
  );
  expect(rows[1].refundOf).toBe(rows[0].id);
  expect(rows[1].shares).toEqual([]);
  expect(rows[1].shares.every((s) => s.memberId.startsWith("target-"))).toBe(true);
  expect(() =>
    planGroupCopy([refund], sources, target, { payerId: null, settlement: false }, () => "new"),
  ).toThrow("original");
});
it("copies uncalculated originals even while destination defaults need review", () => {
  const invalid = {
    ...target,
    categorySplits: target.categorySplits.map((s) => ({ ...s, valid: false })),
  };
  expect(() =>
    planGroupCopy([expense], sources, invalid, { payerId: null, settlement: false }, () => "new"),
  ).not.toThrow();
  const income = planGroupCopy(
    [entry({ kind: "income", amountCents: 100 })],
    sources,
    invalid,
    { payerId: "payer", settlement: true },
    () => "new",
  )[0];
  expect(income.shares).toEqual([]);
  expect(income.settlement).toBe(false);
});
it("bounds and validates batches, exact dates, categories, destination revisions and delete reasons", () => {
  const base = {
    action: "export",
    mutationId: uuid,
    revision: 0,
    entries: [{ id: uuid, version: 0 }],
  };
  expect(parseGroupBulk(base).action).toBe("export");
  for (const patch of [
    { entries: [] },
    { entries: Array(MAX_GROUP_BULK + 1).fill(base.entries[0]) },
    { entries: [base.entries[0], base.entries[0]] },
    { revision: -1 },
    { action: "date", occurredOn: "2026-02-30" },
    { action: "category", categoryId: "foreign" },
    { action: "copy", targetId: uuid, targetRevision: -1, payerId: null, settlement: true },
    { action: "delete", reason: " " },
    { action: "unknown" },
  ])
    expect(() => parseGroupBulk({ ...base, ...patch })).toThrow();
  expect(parseGroupBulk({ ...base, action: "category", categoryId: null }).action).toBe("category");
});
