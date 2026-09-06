import { describe, expect, it } from "vitest";
import { validateCategory } from "./validation";

describe("validateCategory", () => {
  it("accepts a valid category and applies defaults", () => {
    const r = validateCategory({ name: " Coffee " });
    expect(r).toEqual({
      ok: true,
      value: {
        name: "Coffee",
        emoji: "🏷️",
        color: "#c98a5a",
        monthlyBudgetCents: 0,
        budgetGroup: null,
      },
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

  it("accepts an explicit fixed or flexible preference and rejects other values", () => {
    expect(validateCategory({ name: "Rent", budgetGroup: "fixed" })).toMatchObject({
      ok: true,
      value: { budgetGroup: "fixed" },
    });
    expect(validateCategory({ name: "Rent", budgetGroup: "variable" }).ok).toBe(false);
  });

  it("rejects a missing name or negative budget", () => {
    expect(validateCategory({ name: "" }).ok).toBe(false);
    expect(validateCategory({ name: "X", monthlyBudgetCents: -1 }).ok).toBe(false);
  });
});
