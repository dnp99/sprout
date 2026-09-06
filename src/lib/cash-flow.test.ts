import { describe, expect, it } from "vitest";
import {
  cashFlowCsv,
  cashFlowWindowKeys,
  cashFlowSummary,
  expenseByGroup,
  incomeByCategory,
  merchantBreakdown,
  monthlyCashFlow,
  projectMonthPace,
  selectedCashFlowMonthKey,
} from "./cash-flow";
import type { RecurringItem, Transaction } from "./types";

const iso = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();

function txn(o: Partial<Transaction>): Transaction {
  return {
    id: Math.random().toString(36).slice(2),
    merchant: "M",
    emoji: "🧾",
    categoryId: "c",
    categoryName: "Groceries",
    amountCents: -1000,
    method: "import",
    status: "posted",
    dateLabel: "",
    occurredAt: iso(2026, 5, 10),
    isIncome: false,
    ...o,
  };
}

const ROWS: Transaction[] = [
  // June: income 3000.00, expenses 70.00 → net +2930.00
  txn({
    amountCents: 300000,
    isIncome: true,
    incomeSourceName: "Paychecks",
    occurredAt: iso(2026, 5, 1),
  }),
  txn({ amountCents: -5000, categoryName: "Groceries", emoji: "🛒", occurredAt: iso(2026, 5, 10) }),
  txn({
    amountCents: -2000,
    categoryName: "Dining out",
    emoji: "🍽️",
    occurredAt: iso(2026, 5, 12),
  }),
  // Internal move — excluded everywhere.
  txn({
    amountCents: -100000,
    categoryName: "Transfer",
    excludeFromBudget: true,
    occurredAt: iso(2026, 5, 5),
  }),
  // A second income category in June.
  txn({
    amountCents: 40000,
    isIncome: true,
    incomeSourceName: "Side gig",
    emoji: "💼",
    occurredAt: iso(2026, 5, 20),
  }),
  // May: expenses only 300.00 → net −300.00 (dipped into savings).
  txn({ amountCents: -30000, categoryName: "Rent", emoji: "🏠", occurredAt: iso(2026, 4, 3) }),
];

describe("monthlyCashFlow", () => {
  it("returns income/expense/net per key, oldest first, excluding transfers", () => {
    const rows = monthlyCashFlow(ROWS, ["2026-05", "2026-06"]);
    expect(rows.map((r) => r.key)).toEqual(["2026-05", "2026-06"]);

    const may = rows[0];
    expect(may.incomeCents).toBe(0);
    expect(may.expenseCents).toBe(30000);
    expect(may.netCents).toBe(-30000);

    const june = rows[1];
    expect(june.incomeCents).toBe(340000); // 3000 + 400, the 1000 transfer excluded
    expect(june.expenseCents).toBe(7000); // 50 + 20
    expect(june.netCents).toBe(333000);
  });
});

describe("cashFlowWindowKeys", () => {
  it("builds a trailing six-month window and resets a selection outside it", () => {
    const keys = cashFlowWindowKeys(ROWS);
    expect(keys).toEqual(["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"]);
    expect(selectedCashFlowMonthKey(keys, "2026-04")).toBe("2026-04");
    expect(selectedCashFlowMonthKey(keys, "2025-12")).toBe("2026-06");
  });
});

describe("cashFlowSummary", () => {
  it("computes net and savings rate", () => {
    const s = cashFlowSummary({ incomeCents: 340000, expenseCents: 7000 });
    expect(s.netCents).toBe(333000);
    expect(s.savingsRatePct).toBe(98); // round(333000/340000 * 100)
  });

  it("returns a null rate when there's no income", () => {
    const s = cashFlowSummary({ incomeCents: 0, expenseCents: 30000 });
    expect(s.netCents).toBe(-30000);
    expect(s.savingsRatePct).toBeNull();
  });

  it("can go negative when you overspend income", () => {
    const s = cashFlowSummary({ incomeCents: 10000, expenseCents: 15000 });
    expect(s.netCents).toBe(-5000);
    expect(s.savingsRatePct).toBe(-50);
  });
});

describe("incomeByCategory", () => {
  it("groups income by source, largest first, ignoring expenses + excluded rows", () => {
    const rows = incomeByCategory(ROWS, "2026-06");
    expect(rows.map((r) => [r.name, r.cents])).toEqual([
      ["Paychecks", 300000],
      ["Side gig", 40000],
    ]);
  });

  it("is empty for a month with no income", () => {
    expect(incomeByCategory(ROWS, "2026-05")).toEqual([]);
  });

  it("keeps legacy income without a source in the neutral Income bucket", () => {
    const rows = incomeByCategory(
      [
        txn({ amountCents: 12500, isIncome: true, occurredAt: iso(2026, 5, 3) }),
        txn({ amountCents: 7500, isIncome: true, occurredAt: iso(2026, 5, 6) }),
      ],
      "2026-06",
    );
    expect(rows).toEqual([{ name: "Income", emoji: "💰", cents: 20000 }]);
  });
});

describe("merchantBreakdown", () => {
  const rows: Transaction[] = [
    txn({ merchant: "Whole Foods", amountCents: -5000, occurredAt: iso(2026, 5, 10) }),
    txn({ merchant: "Whole Foods", amountCents: -3000, occurredAt: iso(2026, 5, 15) }),
    txn({ merchant: "Blue Bottle", amountCents: -450, occurredAt: iso(2026, 5, 12) }),
    txn({
      merchant: "Acme Corp",
      amountCents: 300000,
      isIncome: true,
      occurredAt: iso(2026, 5, 1),
    }),
    txn({
      merchant: "Bank",
      amountCents: -100000,
      excludeFromBudget: true,
      occurredAt: iso(2026, 5, 5),
    }),
  ];

  it("groups expenses by merchant, largest first, excluding transfers", () => {
    expect(merchantBreakdown(rows, "2026-06", false).map((r) => [r.name, r.cents])).toEqual([
      ["Whole Foods", 8000],
      ["Blue Bottle", 450],
    ]);
  });

  it("groups income by merchant", () => {
    expect(merchantBreakdown(rows, "2026-06", true).map((r) => [r.name, r.cents])).toEqual([
      ["Acme Corp", 300000],
    ]);
  });
});

describe("expenseByGroup", () => {
  const recurring: RecurringItem[] = [
    {
      id: "r1",
      name: "Rent",
      emoji: "🏠",
      amountCents: -185000,
      cadence: "monthly",
      dayOfMonth: 1,
      dayOfWeek: null,
      monthOfYear: null,
      categoryId: "rent",
      frequencyLabel: "Monthly · 1st",
      paused: false,
      isIncome: false,
    },
  ];
  const rows: Transaction[] = [
    // Recurring-backed category → Fixed.
    txn({
      categoryId: "rent",
      categoryName: "Rent",
      amountCents: -185000,
      occurredAt: iso(2026, 5, 1),
    }),
    // Name matches the bills fallback → Fixed, even without a recurring item.
    txn({
      categoryId: "util",
      categoryName: "Utilities",
      amountCents: -8000,
      occurredAt: iso(2026, 5, 10),
    }),
    // No recurring, ordinary name → Flexible.
    txn({
      categoryId: "dining",
      categoryName: "Dining out",
      amountCents: -5000,
      occurredAt: iso(2026, 5, 12),
    }),
    txn({
      categoryId: "fun",
      categoryName: "Fun",
      amountCents: -2000,
      occurredAt: iso(2026, 5, 15),
    }),
    // Excluded + income never count toward the expense split.
    txn({
      categoryName: "Transfer",
      amountCents: -100000,
      excludeFromBudget: true,
      occurredAt: iso(2026, 5, 5),
    }),
    txn({
      categoryName: "Paychecks",
      amountCents: 300000,
      isIncome: true,
      occurredAt: iso(2026, 5, 1),
    }),
  ];

  it("splits expenses into Fixed vs Flexible via the recurring/bills rule, Fixed first", () => {
    expect(expenseByGroup(rows, "2026-06", recurring).map((r) => [r.name, r.cents])).toEqual([
      ["Fixed", 193000], // rent 1850.00 + utilities 80.00
      ["Flexible", 7000], // dining 50.00 + fun 20.00
    ]);
  });

  it("omits an empty group", () => {
    const flexOnly = [
      txn({
        categoryId: "dining",
        categoryName: "Dining out",
        amountCents: -5000,
        occurredAt: iso(2026, 5, 12),
      }),
    ];
    expect(expenseByGroup(flexOnly, "2026-06", []).map((r) => r.name)).toEqual(["Flexible"]);
  });
});

describe("cashFlowCsv", () => {
  it("renders a Month/Income/Expenses/Net table with plain signed decimals", () => {
    const series = monthlyCashFlow(ROWS, ["2026-05", "2026-06"]);
    expect(cashFlowCsv(series)).toBe(
      [
        "Month,Income,Expenses,Net",
        "May 2026,0.00,300.00,-300.00",
        "June 2026,3400.00,70.00,3330.00",
      ].join("\n"),
    );
  });
});

describe("projectMonthPace", () => {
  // 10 of 31 days into July → scale by 31/10 = 3.1×.
  const now = new Date(Date.UTC(2026, 6, 10, 12));

  it("extrapolates the in-progress month's spend to a full-month estimate", () => {
    const p = projectMonthPace({ key: "2026-07", expenseCents: 100000 }, now);
    expect(p).toEqual({
      key: "2026-07",
      projectedExpenseCents: 310000, // 100000 × 31 / 10
      daysElapsed: 10,
      daysInMonth: 31,
    });
  });

  it("returns null for a past month (already complete)", () => {
    expect(projectMonthPace({ key: "2026-06", expenseCents: 100000 }, now)).toBeNull();
  });

  it("returns null on the last day of the month (nothing left to project)", () => {
    const lastDay = new Date(Date.UTC(2026, 6, 31, 12));
    expect(projectMonthPace({ key: "2026-07", expenseCents: 100000 }, lastDay)).toBeNull();
  });
});
