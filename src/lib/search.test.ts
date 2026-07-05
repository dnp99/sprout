import { describe, expect, it } from "vitest";
import { filterTransactions } from "./search";
import type { Transaction } from "./types";

function txn(overrides: Partial<Transaction>): Transaction {
  return {
    id: "t1",
    merchant: "Shop",
    emoji: "🛍️",
    categoryId: "c1",
    categoryName: "Shopping",
    amountCents: -1000,
    method: "import",
    status: "posted",
    dateLabel: "Jun 12",
    occurredAt: "2026-06-12",
    isIncome: false,
    ...overrides,
  };
}

describe("filterTransactions — uncategorized", () => {
  const rows = [
    txn({ id: "a", categoryId: "c1", isIncome: false }), // categorized expense
    txn({ id: "b", categoryId: null, isIncome: false, categoryName: "Uncategorized" }), // uncategorized expense
    txn({ id: "c", categoryId: null, isIncome: true, amountCents: 5000, categoryName: "Income" }), // income (no category by design)
  ];

  it("keeps only expenses with no category", () => {
    const out = filterTransactions(rows, { type: "uncategorized" });
    expect(out.map((t) => t.id)).toEqual(["b"]);
  });

  it("does not treat income as uncategorized", () => {
    const out = filterTransactions(rows, { type: "uncategorized" });
    expect(out.some((t) => t.isIncome)).toBe(false);
  });

  it("still honors the free-text query alongside the type", () => {
    const named = [
      txn({ id: "b", categoryId: null, merchant: "Uber Eats", categoryName: "Uncategorized" }),
      txn({ id: "d", categoryId: null, merchant: "Shell", categoryName: "Uncategorized" }),
    ];
    const out = filterTransactions(named, { type: "uncategorized", query: "uber" });
    expect(out.map((t) => t.id)).toEqual(["b"]);
  });
});
