import { describe, expect, it } from "vitest";
import { buildCategoryBreakdown } from "./category-breakdown";
import type { Category, Transaction } from "./types";

const category = { id: "food", name: "Food", color: "#789765" } as Category;
const row = (patch: Partial<Transaction> = {}): Transaction =>
  ({
    id: "1",
    categoryId: "food",
    amountCents: -1000,
    isIncome: false,
    occurredAt: new Date(2026, 9, 15, 12).toISOString(),
    ...patch,
  }) as Transaction;

describe("category spending partition", () => {
  it("offsets refunds and excludes income, internal moves and other months", () => {
    const model = buildCategoryBreakdown(
      [
        row(),
        row({ amountCents: 200, kind: "reimbursement" }),
        row({ isIncome: true, amountCents: 50000 }),
        row({ excludeFromBudget: true }),
        row({ occurredAt: new Date(2026, 8, 15, 12).toISOString() }),
        row({ categoryId: null, amountCents: -200 }),
      ],
      [category],
      "2026-10",
    );
    expect(model.totalCents).toBe(1000);
    expect(model.rows.map((r) => [r.id, r.cents, r.percent, r.offset])).toEqual([
      ["food", 800, 80, 0],
      [null, 200, 20, 80],
    ]);
    expect(model.rows[0].name).toBe("Food");
  });

  it("keeps every positive category and covers exactly one complete ring", () => {
    const model = buildCategoryBreakdown(
      Array.from({ length: 8 }, (_, i) => row({ categoryId: String(i), amountCents: -i - 1 })),
      [],
      "2026-10",
    );
    expect(model.rows).toHaveLength(8);
    const last = model.rows[model.rows.length - 1]!;
    expect(last.offset + last.percent).toBeCloseTo(100);
    expect(model.totalCents).toBe(36);
  });

  it("does not draw zero or negative-net spending slices", () => {
    const model = buildCategoryBreakdown([row({ amountCents: 1000 })], [category], "2026-10");
    expect(model).toEqual({ totalCents: 0, rows: [] });
    expect(buildCategoryBreakdown([], [], "2026-10")).toEqual(model);
  });
});
