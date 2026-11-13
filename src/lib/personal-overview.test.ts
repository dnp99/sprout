import { expect, it } from "vitest";
import { personalOverviewSummary } from "./personal-overview";
import type { BudgetSummary, Transaction } from "./types";
const now = new Date(2026, 10, 12);
const current: BudgetSummary = {
  budgetCents: 100000,
  allocatedCents: 60000,
  unallocatedCents: 40000,
  spentCents: 1000,
  incomeCents: 10000,
  savedCents: 9000,
  safeToSpendCents: 99000,
  daysLeft: 18,
  monthLabel: "November 2026",
};
const row = (date: string, amountCents: number, extra: Partial<Transaction> = {}) =>
  ({
    occurredAt: `${date}T12:00:00Z`,
    amountCents,
    isIncome: false,
    excludeFromBudget: false,
    kind: "expense",
    ...extra,
  }) as Transaction;
it("retains the authoritative current-month summary and live coaching", () => {
  const result = personalOverviewSummary(current, [], "2026-11", now);
  expect(result.summary).toBe(current);
  expect(result.live).toBe(true);
});
it("browses exact-month totals with refunds and exclusions without changing current state", () => {
  const result = personalOverviewSummary(
    current,
    [
      row("2026-10-01", -20000),
      row("2026-10-02", 3000, { kind: "reimbursement" }),
      row("2026-10-03", 50000, { isIncome: true, kind: "income" }),
      row("2026-10-04", -90000, { excludeFromBudget: true }),
      row("2026-11-01", -999),
    ],
    "2026-10",
    now,
  );
  expect(result).toMatchObject({
    live: false,
    summary: {
      spentCents: 17000,
      incomeCents: 50000,
      savedCents: 33000,
      safeToSpendCents: 83000,
      budgetCents: 100000,
      daysLeft: 0,
    },
  });
  expect(current.spentCents).toBe(1000);
});
it("keeps empty periods empty and clamps available spending for overspent periods", () => {
  expect(personalOverviewSummary(current, [], "2026-09", now).summary.spentCents).toBe(0);
  expect(
    personalOverviewSummary(current, [row("2026-10-01", -150000)], "2026-10", now).summary
      .safeToSpendCents,
  ).toBe(0);
});
