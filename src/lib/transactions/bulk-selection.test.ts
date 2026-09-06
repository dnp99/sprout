import { describe, expect, it } from "vitest";
import { getBulkSelectionContext } from "./bulk-selection";
import type { Transaction } from "@/lib/types";
const row = (
  isIncome: boolean,
  id: string,
  categoryId: string | null = null,
  incomeSourceId: string | null = null,
) => ({ id, isIncome, categoryId, incomeSourceId }) as Transaction;
describe("getBulkSelectionContext", () => {
  it("identifies singular expense selections", () =>
    expect(getBulkSelectionContext([row(false, "a", "food")])).toMatchObject({
      count: 1,
      kind: "expense",
      categoryState: "single",
    }));
  it("marks differing values mixed", () =>
    expect(
      getBulkSelectionContext([row(false, "a", "food"), row(false, "b", "rent")]).categoryState,
    ).toBe("mixed"));
  it("blocks classifiers for mixed transaction kinds", () =>
    expect(getBulkSelectionContext([row(false, "a"), row(true, "b")]).kind).toBe("mixed"));
});
