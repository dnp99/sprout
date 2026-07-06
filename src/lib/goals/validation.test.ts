import { describe, expect, it } from "vitest";
import { validateGoal } from "./validation";

describe("validateGoal", () => {
  it("accepts a valid goal and applies defaults", () => {
    const r = validateGoal({ name: " Japan ", targetCents: 500000 });
    expect(r).toEqual({
      ok: true,
      value: {
        name: "Japan",
        emoji: "🎯",
        color: "#e7a34a",
        targetCents: 500000,
        savedCents: 0,
        targetDate: null,
        isRoundupTarget: false,
      },
    });
  });

  it("carries the round-up target flag through", () => {
    const r = validateGoal({ name: "Trip", targetCents: 100000, isRoundupTarget: true });
    expect(r.ok && r.value.isRoundupTarget).toBe(true);
  });

  it("keeps a valid target date and custom emoji/color", () => {
    const r = validateGoal({
      name: "Laptop",
      emoji: "💻",
      color: "#d97a54",
      targetCents: 200000,
      savedCents: 122000,
      targetDate: "2026-09-01",
    });
    expect(r.ok && r.value.targetDate).toBe("2026-09-01");
    expect(r.ok && r.value.emoji).toBe("💻");
  });

  it("rejects a missing name or non-positive target", () => {
    expect(validateGoal({ name: "", targetCents: 100 }).ok).toBe(false);
    expect(validateGoal({ name: "X", targetCents: 0 }).ok).toBe(false);
    expect(validateGoal({ name: "X", targetCents: 100, targetDate: "2026/09" }).ok).toBe(false);
  });
});
