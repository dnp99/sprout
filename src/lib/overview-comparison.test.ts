import { describe, expect, it } from "vitest";
import { buildOverviewSpendingComparison } from "./overview-comparison";
import type { Transaction } from "./types";

const iso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d, 12)).toISOString();

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
    occurredAt: iso(2026, 7, 10),
    isIncome: false,
    ...o,
  };
}

const ROWS: Transaction[] = [
  txn({ amountCents: -2000, occurredAt: iso(2026, 7, 2) }),
  txn({ amountCents: -3000, occurredAt: iso(2026, 7, 5) }),
  txn({ amountCents: -4000, occurredAt: iso(2026, 6, 2) }),
  txn({ amountCents: -2000, occurredAt: iso(2026, 6, 5) }),
  txn({ amountCents: -5000, occurredAt: iso(2026, 5, 3) }),
  txn({ amountCents: -5000, occurredAt: iso(2026, 4, 6) }),
  txn({ amountCents: -7000, occurredAt: iso(2026, 3, 8) }),
  txn({ amountCents: -6000, occurredAt: iso(2026, 2, 10) }),
  txn({ amountCents: -10000, occurredAt: iso(2025, 7, 4) }),
  txn({ amountCents: -5000, occurredAt: iso(2025, 8, 7) }),
  txn({ amountCents: 120000, occurredAt: iso(2026, 7, 1), isIncome: true }),
  txn({ amountCents: -9000, occurredAt: iso(2026, 7, 8), excludeFromBudget: true }),
];

describe("buildOverviewSpendingComparison", () => {
  const NOW = new Date(Date.UTC(2026, 6, 10));

  it("compares this month to last month at the same day-of-month", () => {
    const comparison = buildOverviewSpendingComparison(ROWS, "month-vs-last-month", NOW);
    expect(comparison.currentLabel).toBe("This month");
    expect(comparison.compareLabel).toBe("Last month");
    expect(comparison.headlineAmountCents).toBe(5000);
    expect(comparison.compareAmountCents).toBe(6000);
    expect(comparison.deltaPct).toBe(-17);
    expect(comparison.currentExtent).toBe(9);
  });

  it("builds an average-month comparison from the prior six months", () => {
    const comparison = buildOverviewSpendingComparison(ROWS, "month-vs-average-month", NOW);
    expect(comparison.compareLabel).toBe("Average month");
    expect(comparison.headlineAmountCents).toBe(5000);
    expect(comparison.compareAmountCents).toBeGreaterThan(0);
    expect(comparison.points).toHaveLength(31);
  });

  it("compares this year against last year using cumulative monthly spend", () => {
    const comparison = buildOverviewSpendingComparison(ROWS, "year-vs-last-year", NOW);
    expect(comparison.currentLabel).toBe("This year");
    expect(comparison.compareLabel).toBe("Last year");
    expect(comparison.headlineAmountCents).toBe(34000);
    expect(comparison.compareAmountCents).toBe(10000);
    expect(comparison.currentExtent).toBe(6);
    expect(comparison.visiblePointCount).toBe(7);
    expect(comparison.xTicks.at(-1)?.label).toBe("Jul");
    expect(comparison.points[6].label).toBe("Jul");
  });

  it("uses daily bars instead of an empty comparison series", () => {
    const comparison = buildOverviewSpendingComparison(
      [txn({ amountCents: -2798, occurredAt: iso(2026, 7, 10) })],
      "month-vs-last-month",
      NOW,
    );

    expect(comparison.chartMode).toBe("single-period");
    expect(comparison.currentSpendValues[9]).toBe(2798);
    expect(comparison.yTicks.map((tick) => tick.label)).toEqual(["$0", "$15", "$30"]);
    // The chart scales against this ceiling, which must match the top y-tick's
    // value so the tallest bar/line never overshoots the highest gridline.
    expect(comparison.axisMaxCents).toBe(3000);
    expect(comparison.axisMaxCents).toBe(comparison.yTicks.at(-1)?.value);
    expect(comparison.axisMaxCents).toBeGreaterThanOrEqual(comparison.maxCents);
  });

  it("keeps the axis ceiling aligned with the top tick in comparison mode", () => {
    const comparison = buildOverviewSpendingComparison(ROWS, "month-vs-last-month", NOW);
    expect(comparison.chartMode).toBe("comparison");
    expect(comparison.axisMaxCents).toBe(comparison.yTicks.at(-1)?.value);
    expect(comparison.axisMaxCents).toBeGreaterThanOrEqual(comparison.maxCents);
  });
});
