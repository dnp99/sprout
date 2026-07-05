import { describe, expect, it } from "vitest";
import {
  daysUntil,
  deriveUpcomingBills,
  dueLabel,
  monthlyBillsTotalCents,
  nextDueDate,
  ordinal,
  recurringFrequencyLabel,
} from "./bills";
import type { RecurringItem } from "./types";

const NOW = new Date(2026, 5, 10); // June 10, 2026

function rec(o: Partial<RecurringItem>): RecurringItem {
  return {
    id: Math.random().toString(36).slice(2),
    name: "Bill",
    emoji: "🧾",
    amountCents: -1000,
    dayOfMonth: 1,
    frequencyLabel: "",
    paused: false,
    isIncome: false,
    ...o,
  };
}

describe("ordinal / recurringFrequencyLabel", () => {
  it("formats ordinals", () => {
    expect([1, 2, 3, 4, 11, 21, 22].map(ordinal)).toEqual([
      "1st",
      "2nd",
      "3rd",
      "4th",
      "11th",
      "21st",
      "22nd",
    ]);
  });
  it("builds a monthly frequency label", () => {
    expect(recurringFrequencyLabel("monthly", 7)).toBe("Monthly · 7th");
  });
});

describe("nextDueDate", () => {
  it("returns this month when the day is still ahead", () => {
    expect(nextDueDate(15, NOW)).toEqual(new Date(2026, 5, 15));
  });
  it("rolls to next month when the day has passed", () => {
    expect(nextDueDate(5, NOW)).toEqual(new Date(2026, 6, 5));
  });
  it("clamps to the month length", () => {
    expect(nextDueDate(31, new Date(2026, 1, 10))).toEqual(new Date(2026, 1, 28)); // Feb 2026
  });
});

describe("daysUntil / dueLabel", () => {
  it("counts whole days", () => {
    expect(daysUntil(new Date(2026, 5, 15), NOW)).toBe(5);
    expect(daysUntil(new Date(2026, 5, 10), NOW)).toBe(0);
  });
  it("labels near-term due dates", () => {
    expect(dueLabel(0)).toBe("Today");
    expect(dueLabel(1)).toBe("Tomorrow");
    expect(dueLabel(6)).toBe("in 6 days");
  });
});

describe("deriveUpcomingBills", () => {
  const items = [
    rec({ name: "Salary", amountCents: 320000, isIncome: true, dayOfMonth: 1 }),
    rec({ name: "Netflix", amountCents: -1599, dayOfMonth: 12 }), // in 2 days → urgent
    rec({ name: "Electric", amountCents: -8800, dayOfMonth: 14 }), // in 4 days
    rec({ name: "Gym", amountCents: -4000, dayOfMonth: 5, paused: true }), // paused → skip
  ];

  it("returns non-paused expenses, soonest first, with amounts positive", () => {
    const bills = deriveUpcomingBills(items, NOW);
    expect(bills.map((b) => b.name)).toEqual(["Netflix", "Electric"]);
    expect(bills[0]).toMatchObject({ amountCents: 1599, dueLabel: "in 2 days", urgent: true });
    expect(bills[1]).toMatchObject({ urgent: false });
  });

  it("respects the limit", () => {
    expect(deriveUpcomingBills(items, NOW, 1)).toHaveLength(1);
  });
});

describe("monthlyBillsTotalCents", () => {
  it("sums non-paused expense magnitudes only", () => {
    const items = [
      rec({ amountCents: -1599 }),
      rec({ amountCents: -8800 }),
      rec({ amountCents: 320000, isIncome: true }), // income excluded
      rec({ amountCents: -4000, paused: true }), // paused excluded
    ];
    expect(monthlyBillsTotalCents(items)).toBe(10399);
  });
});
