import { expect, it } from "vitest";
import type { Transaction } from "@/lib/types";
import { filterScopedTransactions } from "./scoped-filter";
const row = (id: string, patch: Partial<Transaction>) =>
  ({
    id,
    merchant: "Maple Market",
    categoryName: "Food",
    categoryId: "food",
    occurredAt: "2026-10-03T12:00:00Z",
    isIncome: false,
    amountCents: -1200,
    ...patch,
  }) as Transaction;
const rows = [
  row("expense", {}),
  row("uncategorized", { categoryId: null }),
  row("excluded", { excludeFromBudget: true }),
  row("income", {
    isIncome: true,
    kind: "income",
    amountCents: 40000,
    categoryId: null,
    incomeSourceId: "salary",
  }),
  row("refund", { isIncome: true, kind: "reimbursement", amountCents: 1200 }),
];
it("defaults All to the complete ledger and intersects expense/status/category filters", () => {
  expect(filterScopedTransactions(rows, "all", {})).toHaveLength(5);
  expect(
    filterScopedTransactions(rows, "expense", { type: "uncategorized" }).map((r) => r.id),
  ).toEqual(["uncategorized"]);
  expect(
    filterScopedTransactions(rows, "expense", { type: "excluded", categoryId: "food" }).map(
      (r) => r.id,
    ),
  ).toEqual(["excluded"]);
});
it("combines income source, query and amount limits without treating refunds as income", () => {
  expect(
    filterScopedTransactions(rows, "income", {
      incomeSourceId: "salary",
      query: "maple",
      amountMin: 10000,
    }).map((r) => r.id),
  ).toEqual(["income"]);
  expect(filterScopedTransactions(rows, "income", { incomeSourceId: "other" })).toEqual([]);
  expect(filterScopedTransactions(rows, "all", { type: "reimbursement" }).map((r) => r.id)).toEqual(
    ["refund"],
  );
});
