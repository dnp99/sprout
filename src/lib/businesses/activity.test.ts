import { expect, it } from "vitest";
import type { Transaction } from "@/lib/types";
import { filterTransactions } from "@/lib/search";
import { businessActivity, NO_BUSINESS } from "./activity";
const row = (id: string, amountCents: number, patch: Partial<Transaction> = {}): Transaction =>
  ({
    id,
    merchant: id,
    categoryName: "Food",
    categoryId: "food",
    occurredAt: "2026-11-01",
    amountCents,
    isIncome: amountCents > 0,
    businessId: "maple",
    ...patch,
  }) as Transaction;
it("combines business, text, date, category and amount filters without crossing labels", () => {
  const rows = [
    row("Coffee", -1200),
    row("Other", -1200, { businessId: "other" }),
    row("Old", -1200, { occurredAt: "2025-01-01" }),
    row("Income", 10000),
  ];
  expect(
    filterTransactions(rows, {
      businessId: "maple",
      query: "coffee",
      categoryIds: ["food"],
      monthKey: "2026-11",
      amountMax: 1500,
    }).map((r) => r.id),
  ).toEqual(["Coffee"]);
  expect(filterTransactions(rows, { businessId: "missing" })).toEqual([]);
});
it("treats both null and missing legacy assignments as no business", () => {
  const rows = [
    row("none", -100, { businessId: null }),
    row("legacy", -100, { businessId: undefined }),
    row("tagged", -100),
  ];
  expect(filterTransactions(rows, { businessId: NO_BUSINESS }).map((r) => r.id)).toEqual([
    "none",
    "legacy",
  ]);
  expect(filterTransactions(rows, { businessId: "all" })).toHaveLength(3);
});
it("keeps integer-cent cash totals, reduces expenses for reimbursements, and ignores excluded transfers", () => {
  expect(
    businessActivity([
      row("Earned", 10000),
      row("Spent", -3001),
      row("Returned", 501, { kind: "reimbursement", isIncome: false }),
      row("Transfer", 999999, { excludeFromBudget: true }),
    ]),
  ).toEqual({ incomeCents: 10000, expenseCents: 2500, netCents: 7500 });
  expect(
    businessActivity([row("Returned", 501, { kind: "reimbursement", isIncome: false })]),
  ).toEqual({ incomeCents: 0, expenseCents: -501, netCents: 501 });
});
