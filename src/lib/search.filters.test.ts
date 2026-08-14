import { describe, expect, it } from "vitest";
import { filterTransactions, hasAdvancedFilters } from "./search";
import type { Transaction } from "./types";

const t = (id: string, occurredAt: string, amountCents: number): Transaction =>
  ({
    id,
    merchant: id,
    categoryName: "",
    categoryId: null,
    occurredAt,
    amountCents,
    isIncome: amountCents > 0,
    excludeFromBudget: false,
  }) as Transaction;

const txns = [
  t("a", "2026-06-01", -500), // -$5
  t("b", "2026-06-15", -6420), // -$64.20
  t("c", "2026-07-02", -12000), // -$120
  t("d", "2026-07-20", 320000), // +$3,200 income
];
const ids = (rows: Transaction[]) => rows.map((r) => r.id);

describe("filterTransactions advanced dimensions", () => {
  it("filters by inclusive date range", () => {
    expect(ids(filterTransactions(txns, { dateFrom: "2026-06-15", dateTo: "2026-07-02" }))).toEqual(
      ["b", "c"],
    );
    expect(ids(filterTransactions(txns, { dateFrom: "2026-07-01" }))).toEqual(["c", "d"]);
    expect(ids(filterTransactions(txns, { dateTo: "2026-06-01" }))).toEqual(["a"]);
  });

  it("filters by amount magnitude range (income counted by size)", () => {
    // min $60 → excludes the -$5; includes -$64.20, -$120, +$3,200
    expect(ids(filterTransactions(txns, { amountMin: 6000 }))).toEqual(["b", "c", "d"]);
    // max $150 → excludes the +$3,200 income
    expect(ids(filterTransactions(txns, { amountMax: 15000 }))).toEqual(["a", "b", "c"]);
    // a window
    expect(ids(filterTransactions(txns, { amountMin: 6000, amountMax: 15000 }))).toEqual([
      "b",
      "c",
    ]);
  });

  it("combines date + amount + type", () => {
    expect(
      ids(filterTransactions(txns, { dateFrom: "2026-07-01", type: "expense", amountMax: 15000 })),
    ).toEqual(["c"]);
  });

  it("is unchanged when advanced options are unset", () => {
    expect(ids(filterTransactions(txns, {}))).toEqual(["a", "b", "c", "d"]);
  });

  it("matches any selected category", () => {
    const rows = txns.map((row, index) => ({
      ...row,
      categoryId: index === 0 ? "food" : index === 1 ? "bills" : null,
      categoryName: index === 0 ? "Food" : index === 1 ? "Bills" : "Income",
    }));
    expect(ids(filterTransactions(rows, { categoryIds: ["food", "bills"] }))).toEqual(["a", "b"]);
    expect(ids(filterTransactions(rows, { categoryIds: ["income"] }))).toEqual(["d"]);
  });
});

describe("hasAdvancedFilters", () => {
  it("detects any set dimension", () => {
    expect(hasAdvancedFilters({})).toBe(false);
    expect(hasAdvancedFilters({ dateFrom: "2026-06-01" })).toBe(true);
    expect(hasAdvancedFilters({ amountMin: 100 })).toBe(true);
    expect(hasAdvancedFilters({ amountMax: 0 })).toBe(true); // 0 is a real bound
  });
});
