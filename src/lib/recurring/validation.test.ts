import { describe, expect, it } from "vitest";
import { validateRecurring } from "./validation";

describe("validateRecurring", () => {
  it("accepts a bill with defaults", () => {
    const r = validateRecurring({ name: "Netflix", amountCents: -1599, dayOfMonth: 7 });
    expect(r).toEqual({
      ok: true,
      value: {
        name: "Netflix",
        emoji: "🧾",
        amountCents: -1599,
        dayOfMonth: 7,
        paused: false,
        categoryId: null,
      },
    });
  });

  it("defaults the emoji to income for positive amounts", () => {
    const r = validateRecurring({ name: "Salary", amountCents: 320000, dayOfMonth: 1 });
    expect(r.ok && r.value.emoji).toBe("💰");
  });

  it("rejects a zero amount or out-of-range day", () => {
    expect(validateRecurring({ name: "X", amountCents: 0, dayOfMonth: 5 }).ok).toBe(false);
    expect(validateRecurring({ name: "X", amountCents: -100, dayOfMonth: 0 }).ok).toBe(false);
    expect(validateRecurring({ name: "X", amountCents: -100, dayOfMonth: 32 }).ok).toBe(false);
  });
});
