import { describe, expect, it } from "vitest";
import { formatMoney, spentPercent } from "./format";

describe("formatMoney", () => {
  it("formats whole dollars without cents", () => {
    expect(formatMoney(248000)).toBe("$2,480");
    expect(formatMoney(52000)).toBe("$520");
  });

  it("shows cents when the amount is not a whole dollar", () => {
    expect(formatMoney(-6420, { signed: true })).toBe("−$64.20");
  });

  it("prefixes a + for signed income and omits cents when whole", () => {
    expect(formatMoney(320000, { signed: true })).toBe("+$3,200");
  });

  it("forces cents when asked", () => {
    expect(formatMoney(320000, { signed: true, forceCents: true })).toBe("+$3,200.00");
  });
});

describe("spentPercent", () => {
  it("computes and clamps to 0–100", () => {
    expect(spentPercent(52000, 60000)).toBe(87);
    expect(spentPercent(31000, 31000)).toBe(100);
    expect(spentPercent(40000, 20000)).toBe(100);
    expect(spentPercent(100, 0)).toBe(0);
  });
});
