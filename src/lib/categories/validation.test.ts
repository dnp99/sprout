import { describe, expect, it } from "vitest";
import { validateCategory } from "./validation";

describe("validateCategory", () => {
  it("accepts a valid category and applies defaults", () => {
    const r = validateCategory({ name: " Coffee " });
    expect(r).toEqual({
      ok: true,
      value: { name: "Coffee", emoji: "🏷️", color: "#c98a5a", monthlyBudgetCents: 0 },
    });
  });

  it("keeps a provided emoji, color and budget", () => {
    const r = validateCategory({
      name: "Groceries",
      emoji: "🛒",
      color: "#7e9b6b",
      monthlyBudgetCents: 60000,
    });
    expect(r.ok && r.value).toMatchObject({ emoji: "🛒", monthlyBudgetCents: 60000 });
  });

  it("rejects a missing name or negative budget", () => {
    expect(validateCategory({ name: "" }).ok).toBe(false);
    expect(validateCategory({ name: "X", monthlyBudgetCents: -1 }).ok).toBe(false);
  });
});
