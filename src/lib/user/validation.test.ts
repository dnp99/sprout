import { describe, expect, it } from "vitest";
import { validateProfileUpdate } from "./validation";

describe("validateProfileUpdate", () => {
  it("accepts a full profile and normalizes currency", () => {
    const r = validateProfileUpdate({ name: " Taylor ", currency: "cad", budgetCycle: "weekly" });
    expect(r).toEqual({
      ok: true,
      value: { name: "Taylor", currency: "CAD", budgetCycle: "weekly" },
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

it("accepts published release acknowledgements and rejects unknown or malformed versions", () => {
  expect(validateProfileUpdate({ whatsNewSeenVersion: 1 })).toEqual({
    ok: true,
    value: { whatsNewSeenVersion: 1 },
  });
  for (const version of [0, -1, 1.5, 9999, "1", null]) {
    expect(validateProfileUpdate({ whatsNewSeenVersion: version }).ok).toBe(false);
  }
});
