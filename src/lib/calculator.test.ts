import { describe, it, expect } from "vitest";
import { calculateCents } from "./calculator";
describe("money calculator", () => {
  it("respects precedence and rounds once", () => {
    expect(calculateCents("12.50 + 3 × 2 - 1 ÷ 4")).toBe(1825);
    expect(calculateCents("0.1+0.2")).toBe(30);
    expect(calculateCents("1/3*3")).toBe(100);
    expect(calculateCents("1.005")).toBe(101);
    expect(calculateCents("2,50*2")).toBe(500);
  });
  it("rejects invalid or unsafe expressions", () => {
    for (const value of ["", "1/0", "2+", "alert(1)", "1e8", "999999999999999999"])
      expect(calculateCents(value)).toBeNull();
  });
});
