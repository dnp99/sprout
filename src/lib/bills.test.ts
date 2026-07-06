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

const NOW = new Date(2026, 5, 10); // June 10, 2026 (a Wednesday)

function rec(o: Partial<RecurringItem>): RecurringItem {
  return {
    id: Math.random().toString(36).slice(2),
    name: "Bill",
    emoji: "🧾",
    amountCents: -1000,
    cadence: "monthly",
    dayOfMonth: 1,
    dayOfWeek: null,
    monthOfYear: null,
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
  it("labels each cadence", () => {
    expect(recurringFrequencyLabel({ cadence: "monthly", dayOfMonth: 7 })).toBe("Monthly · 7th");
    expect(recurringFrequencyLabel({ cadence: "weekly", dayOfWeek: 2 })).toBe("Weekly · Tuesdays");
    expect(recurringFrequencyLabel({ cadence: "yearly", monthOfYear: 3, dayOfMonth: 15 })).toBe(
      "Yearly · Mar 15",
    );
  });
});

describe("nextDueDate", () => {
  it("monthly: returns this month when the day is still ahead", () => {
    expect(nextDueDate({ cadence: "monthly", dayOfMonth: 15 }, NOW)).toEqual(new Date(2026, 5, 15));
  });
  it("monthly: rolls to next month when the day has passed", () => {
    expect(nextDueDate({ cadence: "monthly", dayOfMonth: 5 }, NOW)).toEqual(new Date(2026, 6, 5));
  });
  it("monthly: clamps to the month length", () => {
    expect(nextDueDate({ cadence: "monthly", dayOfMonth: 31 }, new Date(2026, 1, 10))).toEqual(
      new Date(2026, 1, 28), // Feb 2026
    );
  });
  it("weekly: finds the next matching weekday (0 = today)", () => {
    // NOW is Wed (3). Next Friday (5) is 2 days out.
    expect(nextDueDate({ cadence: "weekly", dayOfWeek: 5 }, NOW)).toEqual(new Date(2026, 5, 12));
    // Same weekday → today.
    expect(nextDueDate({ cadence: "weekly", dayOfWeek: 3 }, NOW)).toEqual(new Date(2026, 5, 10));
    // Monday (1) already passed this week → next Monday.
    expect(nextDueDate({ cadence: "weekly", dayOfWeek: 1 }, NOW)).toEqual(new Date(2026, 5, 15));
  });
  it("yearly: this year if the date is ahead, else next year", () => {
    expect(nextDueDate({ cadence: "yearly", monthOfYear: 12, dayOfMonth: 25 }, NOW)).toEqual(
      new Date(2026, 11, 25),
    );
    expect(nextDueDate({ cadence: "yearly", monthOfYear: 1, dayOfMonth: 5 }, NOW)).toEqual(
      new Date(2027, 0, 5),
    );
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

  it("normalizes weekly and yearly to a monthly equivalent", () => {
    const items = [
      rec({ amountCents: -1000, cadence: "weekly" }), // 1000×52/12 → 4333
      rec({ amountCents: -120000, cadence: "yearly" }), // 120000/12 → 10000
      rec({ amountCents: -5000, cadence: "monthly" }), // 5000
    ];
    expect(monthlyBillsTotalCents(items)).toBe(4333 + 10000 + 5000);
  });
});
