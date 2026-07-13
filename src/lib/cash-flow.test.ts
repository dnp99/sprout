import { describe, expect, it } from "vitest";
import { cashFlowSummary, incomeByCategory, merchantBreakdown, monthlyCashFlow } from "./cash-flow";
import type { Transaction } from "./types";

const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();

function txn(o: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    merchant: "M",
    emoji: "🧾",
    categoryId: "c",
    categoryName: "Groceries",
    amountCents: -1000,
    method: "import",
    status: "posted",
    dateLabel: "",
    occurredAt: iso(2026, 5, 10),
    isIncome: false,
    ...o,
  };
}

const ROWS: Transaction[] = [
  // June: income 3000.00, expenses 70.00 → net +2930.00
  txn({
    amountCents: 300000,
    isIncome: true,
    categoryName: "Paychecks",
    occurredAt: iso(2026, 5, 1),
  }),
  txn({ amountCents: -5000, categoryName: "Groceries", emoji: "🛒", occurredAt: iso(2026, 5, 10) }),
  txn({
    amountCents: -2000,
    categoryName: "Dining out",
    emoji: "🍽️",
    occurredAt: iso(2026, 5, 12),
  }),
  // Internal move — excluded everywhere.
  txn({
    amountCents: -100000,
    categoryName: "Transfer",
    excludeFromBudget: true,
    occurredAt: iso(2026, 5, 5),
  }),
  // A second income category in June.
  txn({
    amountCents: 40000,
    isIncome: true,
    categoryName: "Side gig",
    emoji: "💼",
    occurredAt: iso(2026, 5, 20),
  }),
  // May: expenses only 300.00 → net −300.00 (dipped into savings).
  txn({ amountCents: -30000, categoryName: "Rent", emoji: "🏠", occurredAt: iso(2026, 4, 3) }),
];

describe("monthlyCashFlow", () => {
  it("returns income/expense/net per key, oldest first, excluding transfers", () => {
    const rows = monthlyCashFlow(ROWS, ["2026-05", "2026-06"]);
    expect(rows.map((r) => r.key)).toEqual(["2026-05", "2026-06"]);

    const may = rows[0];
    expect(may.incomeCents).toBe(0);
    expect(may.expenseCents).toBe(30000);
    expect(may.netCents).toBe(-30000);

    const june = rows[1];
    expect(june.incomeCents).toBe(340000); // 3000 + 400, the 1000 transfer excluded
    expect(june.expenseCents).toBe(7000); // 50 + 20
    expect(june.netCents).toBe(333000);
  });
});

describe("cashFlowSummary", () => {
  it("computes net and savings rate", () => {
    const s = cashFlowSummary({ incomeCents: 340000, expenseCents: 7000 });
    expect(s.netCents).toBe(333000);
    expect(s.savingsRatePct).toBe(98); // round(333000/340000 * 100)
  });

  it("returns a null rate when there's no income", () => {
    const s = cashFlowSummary({ incomeCents: 0, expenseCents: 30000 });
    expect(s.netCents).toBe(-30000);
    expect(s.savingsRatePct).toBeNull();
  });

  it("can go negative when you overspend income", () => {
    const s = cashFlowSummary({ incomeCents: 10000, expenseCents: 15000 });
    expect(s.netCents).toBe(-5000);
    expect(s.savingsRatePct).toBe(-50);
  });
});

describe("incomeByCategory", () => {
  it("groups income by category, largest first, ignoring expenses + excluded rows", () => {
    const rows = incomeByCategory(ROWS, "2026-06");
    expect(rows.map((r) => [r.name, r.cents])).toEqual([
      ["Paychecks", 300000],
      ["Side gig", 40000],
    ]);
  });

  it("is empty for a month with no income", () => {
    expect(incomeByCategory(ROWS, "2026-05")).toEqual([]);
  });
});

describe("merchantBreakdown", () => {
  const rows: Transaction[] = [
    txn({ merchant: "Whole Foods", amountCents: -5000, occurredAt: iso(2026, 5, 10) }),
    txn({ merchant: "Whole Foods", amountCents: -3000, occurredAt: iso(2026, 5, 15) }),
    txn({ merchant: "Blue Bottle", amountCents: -450, occurredAt: iso(2026, 5, 12) }),
    txn({
      merchant: "Acme Corp",
      amountCents: 300000,
      isIncome: true,
      occurredAt: iso(2026, 5, 1),
    }),
    txn({
      merchant: "Bank",
      amountCents: -100000,
      excludeFromBudget: true,
      occurredAt: iso(2026, 5, 5),
    }),
  ];

  it("groups expenses by merchant, largest first, excluding transfers", () => {
    expect(merchantBreakdown(rows, "2026-06", false).map((r) => [r.name, r.cents])).toEqual([
      ["Whole Foods", 8000],
      ["Blue Bottle", 450],
    ]);
  });

  it("groups income by merchant", () => {
    expect(merchantBreakdown(rows, "2026-06", true).map((r) => [r.name, r.cents])).toEqual([
      ["Acme Corp", 300000],
    ]);
  });
});
