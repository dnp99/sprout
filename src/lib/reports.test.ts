import { describe, expect, it } from "vitest";
import { buildTrendsReport, monthlySpendForKeys, periodMonthKeys } from "./reports";
import type { Transaction } from "./types";

// Midday so local<->ISO round-trips stay in the intended month regardless of tz.
// `m` is a 0-indexed JS month (5 = June).
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
    occurredAt: iso(2026, 6, 10), // July 2026
    isIncome: false,
    ...o,
  };
}

// A small dataset spanning Feb, Jun, Jul 2026 (latest month = "2026-07").
const DATA: Transaction[] = [
  txn({
    occurredAt: iso(2026, 6, 10),
    amountCents: -10000,
    categoryName: "Groceries",
    merchant: "Farm Boy",
  }),
  txn({
    occurredAt: iso(2026, 6, 12),
    amountCents: 50000,
    isIncome: true,
    categoryName: "Income",
    merchant: "Work",
  }),
  txn({
    occurredAt: iso(2026, 6, 13),
    amountCents: -99900,
    excludeFromBudget: true,
    merchant: "Transfer",
  }),
  txn({
    occurredAt: iso(2026, 5, 8),
    amountCents: -5000,
    categoryName: "Dining out",
    merchant: "Uber Eats",
  }),
  txn({
    occurredAt: iso(2026, 1, 20),
    amountCents: -3000,
    categoryName: "Groceries",
    merchant: "Farm Boy",
  }),
];

describe("periodMonthKeys", () => {
  it("covers the right window per period", () => {
    expect(periodMonthKeys("month", "2026-07")).toEqual(["2026-07"]);
    expect(periodMonthKeys("6m", "2026-07")).toEqual([
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
    expect(periodMonthKeys("12m", "2026-07")).toHaveLength(12);
    expect(periodMonthKeys("12m", "2026-07")[0]).toBe("2025-08");
    expect(periodMonthKeys("ytd", "2026-07")).toEqual([
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
    ]);
  });
});

describe("monthlySpendForKeys", () => {
  it("buckets spend/income and skips excluded", () => {
    const buckets = monthlySpendForKeys(DATA, ["2026-06", "2026-07"]);
    expect(buckets.map((b) => b.key)).toEqual(["2026-06", "2026-07"]);
    expect(buckets[0].spentCents).toBe(5000); // Jun: Uber Eats
    expect(buckets[1].spentCents).toBe(10000); // Jul: Farm Boy (excluded transfer ignored)
    expect(buckets[1].incomeCents).toBe(50000);
  });
});

describe("buildTrendsReport — 6 months", () => {
  const r = buildTrendsReport(DATA, "6m");

  it("aggregates income/spending/net/txnCount over the window", () => {
    expect(r.spendingCents).toBe(18000); // 100 + 50 + 30
    expect(r.incomeCents).toBe(50000);
    expect(r.netCents).toBe(32000);
    expect(r.txnCount).toBe(4); // excluded transfer not counted
    expect(r.rangeLabel).toBe("Feb–Jul 2026");
    expect(r.previousRangeLabel).toBe("Aug 2025 – Jan 2026");
    expect(r.monthsInWindow).toBe(6);
  });

  it("ranks categories with correct shares", () => {
    expect(r.byCategory[0]).toMatchObject({ name: "Groceries", cents: 13000 });
    expect(Math.round(r.byCategory[0].pct)).toBe(72);
    expect(r.byCategory[1]).toMatchObject({ name: "Dining out", cents: 5000 });
  });

  it("ranks frequent spots by visit count", () => {
    expect(r.frequentSpots[0]).toMatchObject({ name: "Farm Boy", count: 2, cents: 13000 });
  });

  it("shows movers vs the empty previous window as increases", () => {
    expect(r.topMovers[0]).toMatchObject({ name: "Groceries", deltaCents: 13000 });
  });
});

describe("buildTrendsReport — month vs ytd", () => {
  it("scopes month stats and renders a daily chart with an explicit baseline", () => {
    const r = buildTrendsReport(DATA, "month");
    expect(r.spendingCents).toBe(10000); // just July
    expect(r.incomeCents).toBe(50000);
    expect(r.txnCount).toBe(2);
    expect(r.rangeLabel).toBe("Jul 2026");
    expect(r.chart.granularity).toBe("day");
    expect(r.chart.points).toHaveLength(31);
    expect(r.chart.points[9]).toMatchObject({ key: "2026-07-10", spentCents: 10000, label: "" });
    expect(r.chart.points[30]).toMatchObject({ key: "2026-07-31", label: "31" });
    expect(r.chart.currentKey).toBe("2026-07-10");
    expect(r.chart.comparisonLabel).toBe("Jun 2026");
    expect(r.chart.yTicks[0]).toEqual({ value: 0, label: "$0" });
    expect(r.chart.axisMaxCents).toBeGreaterThanOrEqual(10000);
  });

  it("compares a live month with the previous month through the same day", () => {
    const rows = [
      txn({ amountCents: -5000, occurredAt: iso(2026, 6, 5) }),
      txn({ amountCents: -10000, occurredAt: iso(2026, 5, 5) }),
      txn({ amountCents: -90000, occurredAt: iso(2026, 5, 20) }),
    ];
    const r = buildTrendsReport(rows, "month", "2026-07", "en-CA", new Date(Date.UTC(2026, 6, 10)));

    expect(r.chart.changePct).toBe(-50);
    expect(r.chart.comparisonLabel).toBe("Jun 2026");
    expect(r.chart.comparisonThroughDay).toBe(10);
  });

  it("ytd spans January through the anchor month", () => {
    const r = buildTrendsReport(DATA, "ytd");
    expect(r.monthsInWindow).toBe(7);
    expect(r.rangeLabel).toBe("Jan–Jul 2026");
    expect(r.chart.granularity).toBe("month");
    expect(r.chart.points).toHaveLength(7);
  });
});
