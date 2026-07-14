import { describe, expect, it } from "vitest";
import { reconcileRecurring, recurringOccurrencesForMonth } from "./reconcile";
import type { RecurringItem, Transaction } from "@/lib/types";

function recurring(overrides: Partial<RecurringItem> = {}): RecurringItem {
  return {
    id: "rent",
    name: "Rent",
    emoji: "🏠",
    amountCents: -120000,
    cadence: "monthly",
    dayOfMonth: 1,
    dayOfWeek: null,
    monthOfYear: null,
    categoryId: "bills",
    frequencyLabel: "Monthly · 1st",
    paused: false,
    isIncome: false,
    ...overrides,
  };
}

function transaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "txn-1",
    merchant: "Rent",
    emoji: "🧾",
    categoryId: "bills",
    categoryName: "Bills & rent",
    amountCents: -120000,
    method: "card",
    status: "posted",
    dateLabel: "Jul 1",
    occurredAt: "2026-07-01T12:00:00.000Z",
    isIncome: false,
    ...overrides,
  };
}

const JULY_10 = new Date("2026-07-10T12:00:00.000Z");

describe("recurringOccurrencesForMonth", () => {
  it("expands every weekly occurrence in a month", () => {
    const rows = recurringOccurrencesForMonth(
      [
        recurring({
          id: "gym",
          name: "Gym",
          cadence: "weekly",
          dayOfWeek: 3,
          frequencyLabel: "Weekly · Wednesdays",
        }),
      ],
      "2026-07",
    );

    expect(rows.map((row) => row.dueDateKey)).toEqual([
      "2026-07-01",
      "2026-07-08",
      "2026-07-15",
      "2026-07-22",
      "2026-07-29",
    ]);
  });

  it("clamps a day-31 schedule at the end of February", () => {
    const rows = recurringOccurrencesForMonth([recurring({ dayOfMonth: 31 })], "2026-02");
    expect(rows[0].dueDateKey).toBe("2026-02-28");
  });
});

describe("reconcileRecurring", () => {
  it("matches an exact amount and normalized merchant name once", () => {
    const summary = reconcileRecurring(
      [recurring({ name: "Netflix", amountCents: -1599 })],
      [transaction({ merchant: "NETFLIX.COM", amountCents: -1599 })],
      { monthKey: "2026-07", now: JULY_10 },
    );

    expect(summary.complete).toHaveLength(1);
    expect(summary.complete[0]).toMatchObject({
      occurrenceId: "rent:2026-07-01",
      matchedTransactionId: "txn-1",
    });
    expect(summary.expenses).toEqual({ totalCents: 1599, completedCents: 1599, remainingCents: 0 });
  });

  it("never lets one transaction complete two weekly occurrences", () => {
    const summary = reconcileRecurring(
      [recurring({ id: "gym", name: "Gym", amountCents: -2000, cadence: "weekly", dayOfWeek: 3 })],
      [
        transaction({
          merchant: "Gym",
          amountCents: -2000,
          occurredAt: "2026-07-08T12:00:00.000Z",
        }),
      ],
      { monthKey: "2026-07", now: JULY_10 },
    );

    expect(summary.complete).toHaveLength(1);
    expect(summary.unmatched).toHaveLength(1);
    expect(summary.upcoming).toHaveLength(3);
  });

  it("leaves weak merchant matches unmatched even when the amount matches", () => {
    const summary = reconcileRecurring(
      [recurring({ name: "Netflix", amountCents: -1599 })],
      [transaction({ merchant: "Spotify", amountCents: -1599 })],
      { monthKey: "2026-07", now: JULY_10 },
    );

    expect(summary.complete).toHaveLength(0);
    expect(summary.unmatched).toHaveLength(1);
  });

  it("does not call a past-due unmatched occurrence upcoming", () => {
    const summary = reconcileRecurring([recurring()], [], { monthKey: "2026-07", now: JULY_10 });
    expect(summary.unmatched).toHaveLength(1);
    expect(summary.upcoming).toHaveLength(0);
  });

  it("ignores paused definitions and excluded transactions", () => {
    const summary = reconcileRecurring(
      [recurring({ paused: true }), recurring({ id: "phone", name: "Phone", amountCents: -5000 })],
      [transaction({ merchant: "Phone", amountCents: -5000, excludeFromBudget: true })],
      { monthKey: "2026-07", now: JULY_10 },
    );

    expect(summary.expenses).toEqual({ totalCents: 5000, completedCents: 0, remainingCents: 5000 });
    expect(summary.unmatched).toHaveLength(1);
  });
});
