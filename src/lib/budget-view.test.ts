import { describe, expect, it } from "vitest";
import { buildBudgetTrackingView } from "./budget-view";
import type { Category, RecurringItem, Transaction } from "./types";

const categories: Category[] = [
  {
    id: "bills",
    name: "Bills & rent",
    emoji: "🏠",
    color: "#d97a54",
    monthlyBudgetCents: 0,
    spentCents: 0,
  },
  {
    id: "groceries",
    name: "Groceries",
    emoji: "🛒",
    color: "#c98a5a",
    monthlyBudgetCents: 0,
    spentCents: 0,
  },
];

const recurring: RecurringItem[] = [
  {
    id: "rent",
    name: "Rent",
    emoji: "🏠",
    amountCents: -185000,
    cadence: "monthly",
    dayOfMonth: 1,
    dayOfWeek: null,
    monthOfYear: null,
    categoryId: "bills",
    frequencyLabel: "Monthly · 1st",
    paused: false,
    isIncome: false,
  },
];

const txns: Transaction[] = [
  {
    id: "t1",
    merchant: "Rent",
    emoji: "🏠",
    categoryId: "bills",
    categoryName: "Bills & rent",
    amountCents: -185000,
    method: "Bank",
    status: "posted",
    dateLabel: "Jul 1",
    occurredAt: "2026-07-01T12:00:00.000Z",
    isIncome: false,
  },
  {
    id: "t2",
    merchant: "Trader Joe's",
    emoji: "🛒",
    categoryId: "groceries",
    categoryName: "Groceries",
    amountCents: -12000,
    method: "Visa",
    status: "posted",
    dateLabel: "Jul 2",
    occurredAt: "2026-07-02T12:00:00.000Z",
    isIncome: false,
  },
];

describe("buildBudgetTrackingView", () => {
  it("groups recurring-backed categories as fixed and computes summary totals", () => {
    const view = buildBudgetTrackingView({
      totalBudgetCents: 300000,
      budgets: { bills: 200000, groceries: 50000 },
      categories,
      recurring,
      transactions: txns,
      monthKey: "2026-07",
    });

    expect(view.monthLabel).toBe("July 2026");
    expect(view.allocatedCents).toBe(250000);
    expect(view.leftToAllocateCents).toBe(50000);
    expect(view.spentCents).toBe(197000);
    expect(view.leftToSpendCents).toBe(103000);

    expect(view.groups.map((group) => group.id)).toEqual(["fixed", "flexible"]);
    expect(view.groups[0].rows.map((row) => row.categoryId)).toEqual(["bills"]);
    expect(view.groups[1].rows.map((row) => row.categoryId)).toEqual(["groceries"]);
  });

  it("marks overspent rows and over-budget months", () => {
    const view = buildBudgetTrackingView({
      totalBudgetCents: 100000,
      budgets: { bills: 40000, groceries: 30000 },
      categories,
      recurring,
      transactions: txns,
      monthKey: "2026-07",
    });

    expect(view.overSpent).toBe(true);
    expect(view.leftToSpendCents).toBe(-97000);
    expect(view.groups[0].rows[0].isOver).toBe(true);
  });
});
