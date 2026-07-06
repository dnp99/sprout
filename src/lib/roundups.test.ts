import { describe, expect, it } from "vitest";
import { availableRoundupsCents, roundUpCents } from "./roundups";
import type { Transaction } from "./types";

function txn(o: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    merchant: "Shop",
    emoji: "🛍️",
    categoryId: "c1",
    categoryName: "Shopping",
    amountCents: -642,
    method: "card",
    status: "posted",
    dateLabel: "",
    occurredAt: "2026-06-10",
    isIncome: false,
    ...o,
  };
}

describe("roundUpCents", () => {
  it("rounds an expense magnitude up to the next dollar", () => {
    expect(roundUpCents(-642)).toBe(58); // $6.42 → $7.00
    expect(roundUpCents(-1)).toBe(99);
    expect(roundUpCents(-1299)).toBe(1);
  });
  it("is 0 for whole dollars and non-expenses", () => {
    expect(roundUpCents(-600)).toBe(0);
    expect(roundUpCents(0)).toBe(0);
    expect(roundUpCents(320000)).toBe(0); // income
  });
});

describe("availableRoundupsCents", () => {
  it("sums round-ups over eligible unswept expenses only", () => {
    const rows = [
      txn({ amountCents: -642 }), // 58
      txn({ amountCents: -1075 }), // 25
      txn({ amountCents: 500000, isIncome: true }), // income → 0
      txn({ amountCents: -9999, excludeFromBudget: true }), // internal move → 0
      txn({ amountCents: -333, roundupSwept: true }), // already swept → 0
    ];
    expect(availableRoundupsCents(rows)).toBe(58 + 25);
  });
});
