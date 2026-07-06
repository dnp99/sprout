import { describe, expect, it } from "vitest";
import { validateProfileUpdate } from "./validation";

describe("validateProfileUpdate", () => {
  it("accepts a full profile and normalizes currency", () => {
    const r = validateProfileUpdate({ name: " Deep ", currency: "cad", budgetCycle: "weekly" });
    expect(r).toEqual({
      ok: true,
      value: { name: "Deep", currency: "CAD", budgetCycle: "weekly" },
    });
  });

  it("is partial — updates only the fields present", () => {
    const r = validateProfileUpdate({ budgetPoolCents: 450000 });
    expect(r).toEqual({ ok: true, value: { budgetPoolCents: 450000 } });
  });

  it("rejects invalid values", () => {
    expect(validateProfileUpdate({ name: "" }).ok).toBe(false);
    expect(validateProfileUpdate({ currency: "" }).ok).toBe(false);
    expect(validateProfileUpdate({ budgetCycle: "daily" }).ok).toBe(false);
    expect(validateProfileUpdate({ budgetPoolCents: -1 }).ok).toBe(false);
  });
});
