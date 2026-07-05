import type { RecurringItem } from "./types";

/** Active (non-paused) recurring income / outflow totals, in cents. */
export function recurringTotals(items: RecurringItem[]) {
  const active = items.filter((i) => !i.paused);
  const incomeCents = active.filter((i) => i.isIncome).reduce((sum, i) => sum + i.amountCents, 0);
  const outCents = active
    .filter((i) => !i.isIncome)
    .reduce((sum, i) => sum + Math.abs(i.amountCents), 0);
  return { incomeCents, outCents, activeCount: active.length };
}

/** Budget allocation summary for the web Categories view. */
export function allocation(budgets: Record<string, number>, totalCents: number) {
  const allocated = Object.values(budgets).reduce((sum, b) => sum + b, 0);
  const remaining = totalCents - allocated;
  return {
    allocated,
    remaining,
    percent: totalCents > 0 ? Math.min(100, Math.round((allocated / totalCents) * 100)) : 0,
    over: remaining < 0,
  };
}
