import { describe, expect, it } from "vitest";
import { ALL_CATEGORIES, UNCATEGORIZED, buildOverviewInsights } from "./overview-insights";
import type { Category, Transaction } from "./types";
const now = new Date("2026-10-28T12:00:00Z");
const row = (
  month: string,
  categoryId: string | null,
  amountCents = -1000,
  extra = {},
): Transaction =>
  ({
    id: month + categoryId,
    occurredAt: month + "-10T12:00:00Z",
    categoryId,
    categoryName: categoryId ?? "Uncategorized",
    amountCents,
    isIncome: false,
    ...extra,
  }) as Transaction;
const categories = [{ id: "food", name: "Food", color: "#789765" }] as Category[];
describe("linked Overview insights", () => {
  it("keeps monthly ring and chart totals aligned, including refunds and exclusions", () => {
    const model = buildOverviewInsights(
      [
        row("2026-10", "food"),
        row("2026-10", "food", 200, { kind: "reimbursement" }),
        row("2026-09", "food", -400),
        row("2026-10", null, -200),
        row("2026-10", "food", -9000, { excludeFromBudget: true }),
        row("2026-10", "food", 9999, { isIncome: true }),
      ],
      categories,
      "2026-10",
      "month-vs-last-month",
      ALL_CATEGORIES,
      now,
    );
    expect(model.totalPositiveCents).toBe(1000);
    expect(model.comparison.headlineAmountCents).toBe(1000);
    expect(model.rows.find((r) => r.id === "food")?.presence).toBe("shared");
    expect(model.rows.find((r) => r.id === UNCATEGORIZED)?.presence).toBe("current-only");
  });
  it("keeps comparison-only categories visible and out of the current ring", () => {
    const model = buildOverviewInsights(
      [row("2026-10", "food"), row("2026-09", "travel")],
      categories,
      "2026-10",
      "month-vs-last-month",
      ALL_CATEGORIES,
      now,
    );
    expect(model.rows.find((r) => r.id === "travel")?.presence).toBe("comparison-only");
    expect(model.slices.map((r) => r.id)).toEqual(["food"]);
    const selected = buildOverviewInsights(
      [row("2026-10", "food"), row("2026-09", "travel")],
      categories,
      "2026-10",
      "month-vs-last-month",
      "travel",
      now,
    );
    expect(selected.comparison.headlineAmountCents).toBe(0);
    expect(selected.comparison.compareAmountCents).toBe(1000);
    expect(selected.slices).toEqual([]);
  });
  it("uses the same year-to-selected-month cutoff in both views", () => {
    const model = buildOverviewInsights(
      [
        row("2026-01", "food"),
        row("2026-10", "food"),
        row("2026-11", "food"),
        row("2025-01", "food", -2000),
      ],
      categories,
      "2026-10",
      "year-vs-last-year",
      "food",
      now,
    );
    expect(model.totalPositiveCents).toBe(2000);
    expect(model.comparison.headlineAmountCents).toBe(2000);
    expect(model.comparison.compareAmountCents).toBe(2000);
  });
  it("keeps net credits separate rather than inventing negative pie area", () => {
    const model = buildOverviewInsights(
      [row("2026-10", "food", 500)],
      categories,
      "2026-10",
      "month-vs-last-month",
      ALL_CATEGORIES,
      now,
    );
    expect(model.rows[0].currentCents).toBe(-500);
    expect(model.comparison.headlineAmountCents).toBe(-500);
    expect(model.slices).toEqual([]);
  });
  it("partitions by actual payer and intersects payer/category filters", () => {
    const records = [
      { ...row("2026-10", "food", -1000), payerId: "alice" },
      { ...row("2026-10", "food", 200), payerId: "alice" },
      { ...row("2026-10", "travel", -500), payerId: "bob" },
      { ...row("2026-09", "travel", -300), payerId: "bob" },
      { ...row("2026-10", "food", -100), payerId: null },
    ];
    const payers = [
      { id: "alice", name: "Alice" },
      { id: "bob", name: "Bob" },
    ];
    const byPayer = buildOverviewInsights(
      records,
      categories,
      "2026-10",
      "month-vs-last-month",
      ALL_CATEGORIES,
      now,
      { dimension: "payer", payers },
    );
    expect(byPayer.comparison.headlineAmountCents).toBe(1400);
    expect(byPayer.rows.find((r) => r.id === "alice")?.currentCents).toBe(800);
    expect(byPayer.rows.find((r) => r.id === "bob")?.presence).toBe("shared");
    const aliceFood = buildOverviewInsights(
      records,
      categories,
      "2026-10",
      "month-vs-last-month",
      "food",
      now,
      { payer: "alice", payers },
    );
    expect(aliceFood.rows.map((r) => r.id)).toEqual(["food"]);
    expect(aliceFood.totalPositiveCents).toBe(800);
    expect(aliceFood.comparison.headlineAmountCents).toBe(800);
  });

  it("synchronizes an explicit day cutoff across ring, comparison and payer filtering", () => {
    const records = [
      { ...row("2026-10", "food", -1000), payerId: "alice" },
      { ...row("2026-10", "food", -500), occurredAt: "2026-10-25T12:00:00Z", payerId: "alice" },
      { ...row("2026-09", "food", -300), payerId: "alice" },
      { ...row("2026-09", "food", -900), occurredAt: "2026-09-25T12:00:00Z", payerId: "alice" },
      { ...row("2026-10", "food", -2000), payerId: "bob" },
    ];
    const model = buildOverviewInsights(
      records,
      categories,
      "2026-10",
      "month-vs-last-month",
      "food",
      now,
      { payer: "alice", throughDate: "2026-10-20" },
    );
    expect(model.totalPositiveCents).toBe(1000);
    expect(model.comparison.headlineAmountCents).toBe(1000);
    expect(model.comparison.compareAmountCents).toBe(300);
    expect(model.comparison.visiblePointCount).toBe(20);
    const full = buildOverviewInsights(
      records,
      categories,
      "2026-10",
      "month-vs-last-month",
      "food",
      now,
      { payer: "alice" },
    );
    expect(full.totalPositiveCents).toBe(1500);
  });
});
