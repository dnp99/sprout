import { describe, expect, it } from "vitest";
import {
  activeTrendKey,
  categoryBreakdown,
  categorySpentForMonth,
  defaultTrendKey,
  latestMonthKey,
  monthKeyLabel,
  monthTotals,
  monthlyTrend,
  resolveViewMonth,
  shiftMonthKey,
  spendChangePercent,
  toDonutSegments,
  toTrendPoints,
  topMovers,
} from "./trends";
import type { Transaction } from "./types";

// Midday so local<->ISO round-trips stay in the intended month regardless of tz.
const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();
const NOW = new Date(2026, 5, 15); // June 2026

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
  txn({ categoryName: "Groceries", emoji: "🛒", amountCents: -5000, occurredAt: iso(2026, 5, 10) }),
  txn({
    categoryName: "Dining out",
    emoji: "🍽️",
    amountCents: -2000,
    occurredAt: iso(2026, 5, 12),
  }),
  txn({ categoryName: "Income", amountCents: 300000, isIncome: true, occurredAt: iso(2026, 5, 1) }),
  // Internal move — must be ignored everywhere.
  txn({
    categoryName: "Transfer",
    amountCents: -100000,
    excludeFromBudget: true,
    occurredAt: iso(2026, 5, 5),
  }),
  txn({ categoryName: "Groceries", emoji: "🛒", amountCents: -3000, occurredAt: iso(2026, 4, 20) }),
];

describe("monthlyTrend", () => {
  it("returns 6 oldest-first buckets ending at the current month", () => {
    const t = monthlyTrend(ROWS, NOW);
    expect(t).toHaveLength(6);
    expect(t.map((m) => m.label)).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun"]);
    expect(t[5].key).toBe("2026-06");
  });

  it("sums spend and income per month, excluding internal moves", () => {
    const t = monthlyTrend(ROWS, NOW);
    const jun = t[5];
    expect(jun.spentCents).toBe(7000); // 5000 + 2000; transfer excluded
    expect(jun.incomeCents).toBe(300000);
    expect(t[4].spentCents).toBe(3000); // May
  });
});

describe("toTrendPoints", () => {
  it("scales heights to the tallest month and flags the selected one", () => {
    const t = monthlyTrend(ROWS, NOW);
    const pts = toTrendPoints(t, "2026-06");
    expect(pts[5].current).toBe(true);
    expect(pts[5].heightPercent).toBe(100); // Jun is the tallest
    expect(pts[4].heightPercent).toBeGreaterThan(0); // May has spend
    expect(pts[0].heightPercent).toBe(0); // Jan empty
  });
});

describe("defaultTrendKey / activeTrendKey", () => {
  const t = monthlyTrend(ROWS, NOW);

  it("defaults to the most recent month with spending", () => {
    expect(defaultTrendKey(t)).toBe("2026-06");
  });

  it("keeps a valid selection but falls back when out of range", () => {
    expect(activeTrendKey(t, "2026-05")).toBe("2026-05");
    expect(activeTrendKey(t, "1999-01")).toBe("2026-06"); // not in range → default
    expect(activeTrendKey(t, "")).toBe("2026-06");
  });
});

describe("shiftMonthKey", () => {
  it("steps months with year rollover", () => {
    expect(shiftMonthKey("2026-06", -1)).toBe("2026-05");
    expect(shiftMonthKey("2026-01", -1)).toBe("2025-12");
    expect(shiftMonthKey("2026-12", 1)).toBe("2027-01");
  });
});

describe("latestMonthKey / resolveViewMonth", () => {
  it("finds the most recent month with data", () => {
    expect(latestMonthKey(ROWS)).toBe("2026-06");
  });
  it("resolves to the stored key, else the latest month", () => {
    expect(resolveViewMonth("2026-05", ROWS)).toBe("2026-05");
    expect(resolveViewMonth("", ROWS)).toBe("2026-06");
  });
});

describe("monthTotals", () => {
  it("totals spend + income for a month, excluding internal moves", () => {
    expect(monthTotals(ROWS, "2026-06")).toEqual({ spentCents: 7000, incomeCents: 300000 });
    expect(monthTotals(ROWS, "2026-05")).toEqual({ spentCents: 3000, incomeCents: 0 });
  });
});

describe("categorySpentForMonth", () => {
  it("sums expense spend per categoryId for a month", () => {
    const rows = [
      txn({ categoryId: "g", amountCents: -5000, occurredAt: iso(2026, 5, 10) }),
      txn({ categoryId: "g", amountCents: -1000, occurredAt: iso(2026, 5, 11) }),
      txn({ categoryId: "d", amountCents: -2000, occurredAt: iso(2026, 5, 12) }),
      txn({ categoryId: "g", amountCents: -9000, occurredAt: iso(2026, 4, 10) }), // other month
    ];
    const map = categorySpentForMonth(rows, "2026-06");
    expect(map.get("g")).toBe(6000);
    expect(map.get("d")).toBe(2000);
  });
});

describe("monthKeyLabel", () => {
  it("formats a month key as a long label", () => {
    expect(monthKeyLabel("2026-06")).toBe("June 2026");
    expect(monthKeyLabel("2026-01")).toBe("January 2026");
    expect(monthKeyLabel("")).toBe("");
  });
});

describe("spendChangePercent", () => {
  it("computes rounded percent change, or null without a baseline", () => {
    expect(spendChangePercent(7000, 3000)).toBe(133);
    expect(spendChangePercent(3000, 6000)).toBe(-50);
    expect(spendChangePercent(5000, 0)).toBeNull();
  });
});

describe("categoryBreakdown", () => {
  it("totals expenses per category for a month, largest first", () => {
    const b = categoryBreakdown(ROWS, "2026-06");
    expect(b.map((c) => [c.name, c.cents])).toEqual([
      ["Groceries", 5000],
      ["Dining out", 2000],
    ]);
    // Income and excluded transfers are not spending.
    expect(b.some((c) => c.name === "Income" || c.name === "Transfer")).toBe(false);
  });
});

describe("toDonutSegments", () => {
  const colors = new Map([
    ["Groceries", "#aaa"],
    ["Dining out", "#bbb"],
  ]);

  it("colors slices by category and computes exact shares", () => {
    const segs = toDonutSegments(
      [
        { name: "Groceries", emoji: "🛒", cents: 6000 },
        { name: "Dining out", emoji: "🍽️", cents: 2000 },
      ],
      colors,
    );
    expect(segs).toEqual([
      { color: "#aaa", pct: 75 },
      { color: "#bbb", pct: 25 },
    ]);
  });

  it("groups the tail past maxSlices into one 'other' slice", () => {
    const breakdown = Array.from({ length: 7 }, (_, i) => ({
      name: `C${i}`,
      emoji: "🧾",
      cents: 1000,
    }));
    const segs = toDonutSegments(breakdown, new Map(), 5);
    expect(segs).toHaveLength(6); // 5 + other
    expect(segs.at(-1)).toEqual({ color: "#d8c3a5", pct: (2000 / 7000) * 100 });
  });

  it("returns [] when there's no spend", () => {
    expect(toDonutSegments([], colors)).toEqual([]);
  });
});

describe("topMovers", () => {
  it("ranks category deltas between two months by absolute change", () => {
    const m = topMovers(ROWS, "2026-06", "2026-05");
    const groceries = m.find((x) => x.name === "Groceries");
    expect(groceries?.deltaCents).toBe(2000); // 5000 - 3000
    const dining = m.find((x) => x.name === "Dining out");
    expect(dining?.deltaCents).toBe(2000); // 2000 - 0 (new this month)
    expect(m.length).toBeLessThanOrEqual(3);
  });
});
