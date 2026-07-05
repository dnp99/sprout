import { describe, expect, it } from "vitest";
import { parseAmountToCents, parseMagnitudeCents } from "./amount";

describe("parseAmountToCents", () => {
  it("parses signed money strings to cents", () => {
    expect(parseAmountToCents("-27.74")).toBe(-2774);
    expect(parseAmountToCents("27.74")).toBe(2774);
    expect(parseAmountToCents("6.50")).toBe(650);
    expect(parseAmountToCents("$1,234.56")).toBe(123456);
    expect(parseAmountToCents("  $ 3,200.00 ")).toBe(320000);
    expect(parseAmountToCents("-$0.99")).toBe(-99);
    expect(parseAmountToCents("10")).toBe(1000);
  });

  it("treats accounting parentheses as negative", () => {
    expect(parseAmountToCents("(27.74)")).toBe(-2774);
    expect(parseAmountToCents("($1,000.00)")).toBe(-100000);
  });

  it("returns 0 for empty / junk", () => {
    expect(parseAmountToCents("")).toBe(0);
    expect(parseAmountToCents("   ")).toBe(0);
    expect(parseAmountToCents(null)).toBe(0);
  });

  it("magnitude is absolute value", () => {
    expect(parseMagnitudeCents("-27.74")).toBe(2774);
    expect(parseMagnitudeCents("27.74")).toBe(2774);
  });
});
