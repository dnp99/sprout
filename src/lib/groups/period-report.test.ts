import { expect, it } from "vitest";
import { aggregateGroupBudgets } from "./period-report";

it("sums saved month plans, allocation changes and signed refund offsets", () => {
  const result = aggregateGroupBudgets([
    {
      budget: { poolCents: 10000, exists: true, allocations: { food: 4000 } },
      summary: {
        spendingCents: 2500,
        incomeCents: 6000,
        yourShareCents: 1250,
        categorySpending: { food: 2500 },
      },
    },
    {
      budget: { poolCents: 20000, exists: true, allocations: { food: 5000, rent: 10000 } },
      summary: {
        spendingCents: -500,
        incomeCents: 7000,
        yourShareCents: -250,
        categorySpending: { food: -500 },
      },
    },
    {
      budget: { poolCents: 0, exists: false, allocations: {} },
      summary: {
        spendingCents: 100,
        incomeCents: 0,
        yourShareCents: 100,
        categorySpending: { other: 100 },
      },
    },
  ]);
  expect(result.budget).toEqual({
    poolCents: 30000,
    exists: true,
    allocations: { food: 9000, rent: 10000 },
  });
  expect(result.summary).toEqual({
    spendingCents: 2100,
    incomeCents: 13000,
    yourShareCents: 1100,
    categorySpending: { food: 2000, other: 100 },
  });
});

it("returns zero for an empty range instead of borrowing the current budget", () => {
  expect(aggregateGroupBudgets([]).budget).toEqual({
    poolCents: 0,
    exists: false,
    allocations: {},
  });
});
