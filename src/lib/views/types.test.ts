import { describe, expect, it } from "vitest";
import { sanitizeFilters } from "./types";

describe("sanitizeFilters", () => {
  it("keeps known string keys and drops unknown / non-string values", () => {
    expect(
      sanitizeFilters({
        type: "expense",
        amountMin: "50",
        categoryId: 123, // non-string → dropped
        bogus: "x", // unknown key → dropped
      }),
    ).toEqual({ type: "expense", amountMin: "50" });
  });

  it("returns an empty object for null / non-object input", () => {
    expect(sanitizeFilters(null)).toEqual({});
    expect(sanitizeFilters(undefined)).toEqual({});
    expect(sanitizeFilters("nope")).toEqual({});
  });

  it("captures the full filter set", () => {
    const full = {
      type: "income",
      categoryId: "c1",
      query: "uber",
      dateFrom: "2026-06-01",
      dateTo: "2026-06-30",
      amountMin: "10",
      amountMax: "100",
      sortKey: "amount",
      sortDir: "asc",
    };
    expect(sanitizeFilters(full)).toEqual(full);
  });
});
