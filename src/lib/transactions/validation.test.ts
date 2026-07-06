import { describe, expect, it } from "vitest";
import { validateCreateTransaction, validateUpdateTransaction } from "./validation";

describe("validateCreateTransaction", () => {
  it("accepts a well-formed expense", () => {
    const result = validateCreateTransaction({
      merchant: "Whole Foods",
      amountCents: -6420,
      categoryId: "c_groceries",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.merchant).toBe("Whole Foods");
      expect(result.value.method).toBe("card");
    }
  });

  it("rejects a missing merchant", () => {
    const result = validateCreateTransaction({ amountCents: -100 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toContain("merchant is required");
  });

  it("rejects a zero or non-integer amount", () => {
    expect(validateCreateTransaction({ merchant: "X", amountCents: 0 }).ok).toBe(false);
    expect(validateCreateTransaction({ merchant: "X", amountCents: 1.5 }).ok).toBe(false);
  });

  it("rejects an unknown payment method", () => {
    const result = validateCreateTransaction({
      merchant: "X",
      amountCents: -100,
      method: "crypto",
    });
    expect(result.ok).toBe(false);
  });
});

describe("validateUpdateTransaction — excludeFromBudget", () => {
  it("carries the flag through when true", () => {
    const result = validateUpdateTransaction({
      merchant: "Mortgage",
      amountCents: -279104,
      categoryId: null,
      note: null,
      excludeFromBudget: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.excludeFromBudget).toBe(true);
  });

  it("defaults to false when omitted or not strictly true", () => {
    const omitted = validateUpdateTransaction({ merchant: "Cafe", amountCents: -500 });
    const truthy = validateUpdateTransaction({
      merchant: "Cafe",
      amountCents: -500,
      excludeFromBudget: "yes",
    });
    expect(omitted.ok && omitted.value.excludeFromBudget).toBe(false);
    expect(truthy.ok && truthy.value.excludeFromBudget).toBe(false);
  });
});
