import type { Transaction } from "./types";
import { monthKeyOf, type CategorySpend } from "./trends";
import { monthlySpendForKeys } from "./reports";

/**
 * Cash-flow view-model (plan 012) — income vs. expenses vs. net over time plus a
 * savings rate, all derived from transactions. Composes the existing spend/income
 * bucketing (which already drops `excludeFromBudget` rows — transfers, card/loan
 * payments), so cash flow ties out to the budget. Pure + unit-tested.
 */

export interface CashFlowMonth {
  /** "2026-06" — stable key. */
  key: string;
  /** "Jun" — short month label. */
  label: string;
  incomeCents: number;
  expenseCents: number;
  /** income − expense; negative when you dipped into savings. */
  netCents: number;
}

/** Income, expense and net per month for an explicit set of month keys (oldest
 *  first). Drives the cash-flow chart. */
export function monthlyCashFlow(transactions: Transaction[], keys: string[]): CashFlowMonth[] {
  return monthlySpendForKeys(transactions, keys).map((m) => ({
    key: m.key,
    label: m.label,
    incomeCents: m.incomeCents,
    expenseCents: m.spentCents,
    netCents: m.incomeCents - m.spentCents,
  }));
}

export interface CashFlowSummary {
  incomeCents: number;
  expenseCents: number;
  netCents: number;
  /** net ÷ income as a whole-number %, or null when there's no income to divide
   *  by (shown as "—"). Goal contributions don't count as saved — see plan 012. */
  savingsRatePct: number | null;
}

/** Totals + savings rate for a single month's income/expense figures. */
export function cashFlowSummary(month: {
  incomeCents: number;
  expenseCents: number;
}): CashFlowSummary {
  const netCents = month.incomeCents - month.expenseCents;
  const savingsRatePct =
    month.incomeCents > 0 ? Math.round((netCents / month.incomeCents) * 100) : null;
  return {
    incomeCents: month.incomeCents,
    expenseCents: month.expenseCents,
    netCents,
    savingsRatePct,
  };
}

/** Income grouped by category for a month — the positive-side sibling of
 *  `categoryBreakdown` (which sums expenses). Largest first; excludes
 *  budget-excluded rows so it matches the chart's income total. */
export function incomeByCategory(
  transactions: Transaction[],
  monthKeyValue: string,
): CategorySpend[] {
  const byName = new Map<string, CategorySpend>();
  for (const t of transactions) {
    if (t.excludeFromBudget || !t.isIncome) continue;
    if (monthKeyOf(t.occurredAt) !== monthKeyValue) continue;
    const existing = byName.get(t.categoryName);
    if (existing) existing.cents += t.amountCents;
    else byName.set(t.categoryName, { name: t.categoryName, emoji: t.emoji, cents: t.amountCents });
  }
  return [...byName.values()].sort((a, b) => b.cents - a.cents);
}

/** Income or expense grouped by **merchant** for a month (the Category ⇄ Merchant
 *  toggle). Same shape + exclusions as the category breakdowns, so totals match. */
export function merchantBreakdown(
  transactions: Transaction[],
  monthKeyValue: string,
  income: boolean,
): CategorySpend[] {
  const byName = new Map<string, CategorySpend>();
  for (const t of transactions) {
    if (t.excludeFromBudget || t.isIncome !== income) continue;
    if (monthKeyOf(t.occurredAt) !== monthKeyValue) continue;
    const cents = income ? t.amountCents : -t.amountCents;
    const existing = byName.get(t.merchant);
    if (existing) existing.cents += cents;
    else byName.set(t.merchant, { name: t.merchant, emoji: t.emoji, cents });
  }
  return [...byName.values()].sort((a, b) => b.cents - a.cents);
}
