import { describe, expect, it } from "vitest";
import { filterTransactions, sortTransactions } from "./search";
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

describe("filterTransactions — excluded", () => {
  it("keeps only budget-excluded rows", () => {
    const rows = [
      txn({ id: "a", excludeFromBudget: false }),
      txn({ id: "b", excludeFromBudget: true }), // internal move
      txn({ id: "c", isIncome: true, amountCents: 5000, excludeFromBudget: true }),
    ];
    const out = filterTransactions(rows, { type: "excluded" });
    expect(out.map((t) => t.id)).toEqual(["b", "c"]);
  });
});

describe("sortTransactions — amount sorts by magnitude", () => {
  it("ranks a −$6,000 expense above +$5,000 income (biggest by size first)", () => {
    const rows = [
      txn({ id: "income", amountCents: 500000, isIncome: true }),
      txn({ id: "expense", amountCents: -600000 }),
      txn({ id: "tiny", amountCents: -10000 }),
    ];
    expect(sortTransactions(rows, "amount", "desc").map((t) => t.id)).toEqual([
      "expense",
      "income",
      "tiny",
    ]);
    expect(sortTransactions(rows, "amount", "asc").map((t) => t.id)).toEqual([
      "tiny",
      "income",
      "expense",
    ]);
  });
});
