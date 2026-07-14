import { describe, expect, it } from "vitest";
import { validateOccurrenceCompletion, validateRecurring } from "./validation";

describe("validateRecurring", () => {
  it("accepts a monthly bill with defaults", () => {
    const r = validateRecurring({ name: "Netflix", amountCents: -1599, dayOfMonth: 7 });
    expect(r).toEqual({
      ok: true,
      value: {
        name: "Netflix",
        emoji: "🧾",
        amountCents: -1599,
        cadence: "monthly",
        dayOfMonth: 7,
        dayOfWeek: null,
        monthOfYear: null,
        paused: false,
        categoryId: null,
      },
    });
  });

  it("defaults the emoji to income for positive amounts", () => {
    const r = validateRecurring({ name: "Salary", amountCents: 320000, dayOfMonth: 1 });
    expect(r.ok && r.value.emoji).toBe("💰");
  });

  it("rejects a zero amount or out-of-range monthly day", () => {
    expect(validateRecurring({ name: "X", amountCents: 0, dayOfMonth: 5 }).ok).toBe(false);
    expect(validateRecurring({ name: "X", amountCents: -100, dayOfMonth: 0 }).ok).toBe(false);
    expect(validateRecurring({ name: "X", amountCents: -100, dayOfMonth: 32 }).ok).toBe(false);
  });

  it("accepts a weekly bill and requires a valid dayOfWeek", () => {
    const ok = validateRecurring({
      name: "Trash pickup",
      amountCents: -500,
      cadence: "weekly",
      dayOfWeek: 2,
    });
    expect(ok.ok && ok.value).toMatchObject({
      cadence: "weekly",
      dayOfWeek: 2,
      dayOfMonth: 1,
      monthOfYear: null,
    });
    expect(validateRecurring({ name: "X", amountCents: -500, cadence: "weekly" }).ok).toBe(false);
    expect(
      validateRecurring({ name: "X", amountCents: -500, cadence: "weekly", dayOfWeek: 7 }).ok,
    ).toBe(false);
  });

  it("accepts a yearly bill and requires month + day", () => {
    const ok = validateRecurring({
      name: "Insurance",
      amountCents: -120000,
      cadence: "yearly",
      monthOfYear: 3,
      dayOfMonth: 15,
    });
    expect(ok.ok && ok.value).toMatchObject({
      cadence: "yearly",
      monthOfYear: 3,
      dayOfMonth: 15,
      dayOfWeek: null,
    });
    expect(
      validateRecurring({ name: "X", amountCents: -100, cadence: "yearly", dayOfMonth: 5 }).ok,
    ).toBe(false); // missing month
  });

  it("rejects an unknown cadence", () => {
    expect(
      validateRecurring({ name: "X", amountCents: -100, cadence: "biweekly", dayOfMonth: 5 }).ok,
    ).toBe(false);
  });
});

describe("validateOccurrenceCompletion", () => {
  it("accepts a real date-only occurrence key", () => {
    expect(validateOccurrenceCompletion({ dueDate: "2026-07-01" })).toEqual({
      ok: true,
      value: { dueDate: "2026-07-01" },
    });
  });

  it("rejects invalid or non-date-only occurrence keys", () => {
    expect(validateOccurrenceCompletion({ dueDate: "2026-02-30" }).ok).toBe(false);
    expect(validateOccurrenceCompletion({ dueDate: "2026-07-01T12:00:00.000Z" }).ok).toBe(false);
  });
});
