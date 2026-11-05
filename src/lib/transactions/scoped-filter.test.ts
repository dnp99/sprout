import { expect, it } from "vitest";
import type { Transaction } from "@/lib/types";
import { filterScopedTransactions, ledgerMonthScope } from "./scoped-filter";
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

it("keeps Personal month counts, rows and totals on the same date scope", () => {
  const monthKey = ledgerMonthScope("2026-10", "all", "custom");
  const result = filterScopedTransactions(
    [...rows, row("prior", { occurredAt: "2026-09-01T12:00:00Z" })],
    "all",
    { monthKey },
  );
  expect(result.map((value) => value.id)).not.toContain("prior");
  expect(result).toHaveLength(rows.length);
  expect(ledgerMonthScope("2026-10", "studio", "custom")).toBeUndefined();
  expect(ledgerMonthScope("2026-10", "studio", "month")).toBe("2026-10");
  expect(ledgerMonthScope("2026-10", "all", "month", true)).toBeUndefined();
});
