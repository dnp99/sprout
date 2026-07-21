import { describe, expect, it } from "vitest";
import { parseAmountToCents, parseMoney } from "./amount";

describe("parseAmountToCents with declared decimal notation", () => {
  it("defaults to period (US) notation", () => {
    expect(parseAmountToCents("$1,234.56")).toBe(123456);
    expect(parseAmountToCents("-27.74")).toBe(-2774);
  });

  it("parses comma-decimal notation without corrupting the value", () => {
    expect(parseAmountToCents("1.234,56", "comma")).toBe(123456);
    expect(parseAmountToCents("-27,74", "comma")).toBe(-2774);
    expect(parseAmountToCents("64,20", "comma")).toBe(6420);
  });

  it("comma notation treats period/space as thousands", () => {
    expect(parseAmountToCents("1 234,50", "comma")).toBe(123450);
  });
});

describe("parseMoney (strict)", () => {
  it("parses declared notation", () => {
    expect(parseMoney("64.20", "period")).toEqual({ ok: true, cents: 6420 });
    expect(parseMoney("64,20", "comma")).toEqual({ ok: true, cents: 6420 });
  });

  it("rejects empty and non-numeric", () => {
    expect(parseMoney("").ok).toBe(false);
    expect(parseMoney("abc").ok).toBe(false);
  });

  it("rejects a lone ambiguous thousands group when notation is undeclared", () => {
    expect(parseMoney("1,234").ok).toBe(false); // 1.234 or 1,234?
  });

  it("accepts the same value once notation is declared", () => {
    expect(parseMoney("1,234", "comma")).toEqual({ ok: true, cents: 123 }); // 1.234 → 123.4¢
    expect(parseMoney("1,234", "period")).toEqual({ ok: true, cents: 123400 }); // 1,234.00
  });
});
