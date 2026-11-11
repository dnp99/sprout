import { expect, it } from "vitest";
import { buildOverviewInsights } from "@/lib/overview-insights";
import {
  futureReportPoints,
  groupCumulativeComparison,
  groupInsightColors,
  insightFilterCount,
  groupComparisonCutoff,
  groupComparisonRanges,
} from "./report-presentation";
import type { Transaction } from "@/lib/types";
const row = (date: string, extra = {}) =>
  ({
    occurredAt: date + "T12:00:00Z",
    amountCents: -1000,
    isIncome: false,
    ...extra,
  }) as Transaction;
it("uses UTC financial days and marks only existing future-dated points", () => {
  const rows = [
    row("2026-11-11"),
    row("2026-11-12"),
    row("2026-12-01"),
    row("2026-11-13", { excludeFromBudget: true }),
    row("2026-11-14", { isIncome: true }),
  ];
  const now = new Date("2026-11-11T23:59:59Z");
  expect(futureReportPoints(rows, ["2026-11-11", "2026-11-12", "2026-11-14"], now)).toEqual({
    count: 2,
    keys: ["2026-11-12"],
  });
  expect(futureReportPoints(rows, ["2026-11", "2026-12"], now)).toEqual({
    count: 3,
    keys: ["2026-11", "2026-12"],
  });
  expect(futureReportPoints(rows, ["2026-10"], now)).toEqual({ count: 0, keys: [] });
  expect(rows[1].amountCents).toBe(-1000);
});

it("retains signed totals and a real zero baseline while scaling cumulative visible points", () => {
  const model = buildOverviewInsights(
    [row("2026-10-01"), row("2026-10-31", { amountCents: -900000 })],
    [],
    "2026-10",
    "month-vs-last-month",
    undefined,
    new Date("2026-10-11T12:00:00Z"),
  );
  const chart = groupCumulativeComparison(model.comparison);
  expect(chart.chartMode).toBe("comparison");
  expect(chart.headlineAmountCents).toBe(model.comparison.headlineAmountCents);
  expect(chart.compareAmountCents).toBe(0);
  expect(chart.points).toBe(model.comparison.points);
  expect(chart.axisMaxCents).toBeGreaterThanOrEqual(1000);
  expect(chart.axisMaxCents).toBeLessThan(900000);
});
it("assigns stable semantic colors and counts only changed analytical filters", () => {
  const model = buildOverviewInsights(
    [row("2026-10-01", { categoryId: "food" }), row("2026-10-02", { categoryId: "travel" })],
    [],
    "2026-10",
    "month-vs-last-month",
  );
  const colored = groupInsightColors(model, ["food", "travel"]);
  expect(colored.comparison).toBe(model.comparison);
  expect(colored.rows.map((r) => r.color)).toEqual([
    "var(--chart-category-1, var(--primary-ink))",
    "var(--chart-category-2, var(--primary-ink))",
  ]);
  expect(colored.slices.map((r) => r.color)).toEqual(colored.rows.map((r) => r.color));
  expect(
    insightFilterCount({
      dimension: "category",
      preset: "month-vs-last-month",
      payer: "__all",
      category: "__all",
    }),
  ).toBe(0);
  expect(
    insightFilterCount({
      dimension: "payer",
      preset: "year-vs-last-year",
      payer: "alex",
      category: "food",
      throughDate: "2026-10-11",
    }),
  ).toBe(5);
});

it("labels both same-progress cutoffs including leap-year and yearly boundaries", () => {
  expect(groupComparisonCutoff("2026-11", false, "2026-11-11")).toBe("2026-10-11");
  expect(groupComparisonCutoff("2024-03", false, "2024-03-31")).toBe("2024-02-29");
  expect(groupComparisonCutoff("2026-03", false, "2026-03-31")).toBe("2026-02-28");
  expect(groupComparisonCutoff("2026-11", true, "2026-11-11")).toBe("2025-11");
});

it("labels actual inclusive comparison ranges without changing reporting windows", () => {
  expect(groupComparisonRanges("2026-11", "month-vs-last-month", "2026-11-11")).toEqual({
    selected: ["2026-11-01", "2026-11-11"],
    comparison: ["2026-10-01", "2026-10-11"],
  });
  expect(groupComparisonRanges("2026-11", "year-vs-last-year", "2026-11-11")).toEqual({
    selected: ["2026-01-01", "2026-11-30"],
    comparison: ["2025-01-01", "2025-11-30"],
  });
  expect(
    groupComparisonRanges("2026-11", "month-vs-average-month", "2026-11-11").comparison,
  ).toBeUndefined();
});
