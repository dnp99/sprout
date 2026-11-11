import { afterEach, expect, it, vi } from "vitest";
import { groupTrendSource } from "./trend-source";
import type { GroupEntry, GroupSnapshot } from "./dto";
import { ALL_CATEGORIES, buildOverviewInsights } from "@/lib/overview-insights";
import { buildTrendsReport } from "@/lib/reports";

const entry = (id: string, day: string, cents: number, extra = {}) =>
  ({
    id,
    occurredOn: day,
    amountCents: cents,
    kind: "expense",
    categoryId: "food",
    payerId: "alex",
    merchant: "Maple Market",
    ...extra,
  }) as GroupEntry;
const snapshot = (reportEntries?: GroupEntry[]) =>
  ({
    categories: [{ id: "food", name: "Food" }],
    members: [{ id: "alex", name: "Alex" }],
    budget: { allocations: {} },
    summary: { categorySpending: {} },
    entries: [entry("paged", "2026-11-01", -999999)],
    reportEntries,
  }) as unknown as GroupSnapshot;
const source = (rows?: GroupEntry[]) =>
  groupTrendSource(snapshot(rows), { sharedFunds: "Shared funds", uncategorized: "Uncategorized" });
afterEach(() => vi.useRealTimers());

it("waits for the full report history instead of reporting paginated totals", () => {
  expect(source()).toMatchObject({ loading: true, transactions: [] });
  expect(source([])).toMatchObject({ loading: false, transactions: [] });
});
it("preserves payer identity, income and signed refunds, excluding voids", () => {
  const result = source([
    entry("expense", "2026-10-01", -1000),
    entry("refund", "2026-10-31", 200, { kind: "refund" }),
    entry("income", "2026-10-02", 4000, { kind: "income", payerId: null }),
    entry("void", "2026-10-03", -9000, { voidedAt: "2026-10-04" }),
  ]);
  expect(result.transactions.map((r) => [r.id, r.payerId, r.isIncome, r.amountCents])).toEqual([
    ["expense", "alex", false, -1000],
    ["refund", "alex", false, 200],
    ["income", null, true, 4000],
  ]);
  const report = buildTrendsReport(result.transactions, "month", "2026-10");
  const detail = buildOverviewInsights(
    result.transactions,
    result.categories,
    "2026-10",
    "month-vs-last-month",
    ALL_CATEGORIES,
    new Date("2026-11-11T12:00:00Z"),
  );
  expect(report.spendingCents).toBe(800);
  expect(detail.comparison.headlineAmountCents).toBe(report.spendingCents);
  expect(report.incomeCents).toBe(4000);
});
it("explains full-month versus live-day totals without changing money calculations", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
  const result = source([
    entry("recorded", "2026-11-10", -152519),
    entry("future", "2026-11-20", -28852),
    entry("outside", "2026-12-01", -700),
  ]);
  expect(buildTrendsReport(result.transactions, "month", "2026-11").spendingCents).toBe(181371);
  expect(
    buildOverviewInsights(result.transactions, result.categories, "2026-11", "month-vs-last-month")
      .comparison.headlineAmountCents,
  ).toBe(152519);
});
it("intersects actual payer/category filters and retains comparison-only categories", () => {
  const result = source([
    entry("food", "2026-10-01", -1000),
    entry("other", "2026-10-02", -3000, { payerId: "taylor" }),
    entry("prior", "2026-09-01", -500, { categoryId: "travel" }),
  ]);
  const detail = buildOverviewInsights(
    result.transactions,
    result.categories,
    "2026-10",
    "month-vs-last-month",
    "food",
    new Date("2026-11-11"),
    { payer: "alex" },
  );
  expect(detail.comparison.headlineAmountCents).toBe(1000);
  const all = buildOverviewInsights(
    result.transactions,
    result.categories,
    "2026-10",
    "month-vs-last-month",
    ALL_CATEGORIES,
    new Date("2026-11-11"),
  );
  expect(all.rows.find((r) => r.id === "travel")?.presence).toBe("comparison-only");
});
