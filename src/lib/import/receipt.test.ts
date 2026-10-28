import { describe, expect, it } from "vitest";
import { validateReceipt } from "./receipt";
describe("receipt extraction boundary", () => {
  it("preserves items and total separately without double counting", () => {
    const result = validateReceipt({
      merchant: "Store",
      date: "2026-10-28",
      totalCents: 1100,
      items: [
        { description: "Food", amountCents: 1000 },
        { description: "Tax", amountCents: 100 },
      ],
    });
    expect(result?.items.reduce((sum, r) => sum + r.amountCents, 0)).toBe(1100);
    expect(result?.items).toHaveLength(2);
  });
  it("rejects unreadable, decimal and unsafe item amounts", () => {
    for (const amountCents of [null, 1.5, -1, Infinity, 100000001])
      expect(
        validateReceipt({ merchant: "Store", items: [{ description: "Food", amountCents }] }),
      ).toBeNull();
    expect(validateReceipt({ merchant: "Store", items: [] })).toBeNull();
  });
  it("leaves missing or invalid dates for manual correction", () => {
    expect(
      validateReceipt({
        merchant: "Store",
        date: "2026-02-30",
        items: [{ description: "Food", amountCents: 100 }],
      })?.date,
    ).toBe("");
    expect(
      validateReceipt({
        merchant: "Store",
        date: "2026-99-99",
        items: [{ description: "Food", amountCents: 100 }],
      })?.date,
    ).toBe("");
  });
});
