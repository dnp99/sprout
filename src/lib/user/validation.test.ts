import { describe, expect, it } from "vitest";
import { validateProfileUpdate } from "./validation";

describe("validateProfileUpdate", () => {
  it("accepts a valid profile and normalizes currency", () => {
    const r = validateProfileUpdate({ name: " Deep ", currency: "cad", budgetCycle: "weekly" });
    expect(r).toEqual({
      ok: true,
      value: { name: "Deep", currency: "CAD", budgetCycle: "weekly" },
    });
  });

  it("defaults an unknown budget cycle to monthly", () => {
    const r = validateProfileUpdate({ name: "A", currency: "USD", budgetCycle: "daily" });
    expect(r.ok && r.value.budgetCycle).toBe("monthly");
  });

  it("requires a name and a currency", () => {
    expect(validateProfileUpdate({ name: "", currency: "USD" }).ok).toBe(false);
    expect(validateProfileUpdate({ name: "A", currency: "" }).ok).toBe(false);
  });
});
