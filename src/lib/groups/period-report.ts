import type { GroupSnapshot } from "./dto";

/** Sum saved monthly budgets once per month; never multiply the anchor month's
 * plan or include repayment balances in spending totals. */
export function aggregateGroupBudgets(
  rows: Pick<GroupSnapshot, "budget" | "summary">[],
): Pick<GroupSnapshot, "budget" | "summary"> {
  const result = {
    budget: { poolCents: 0, allocations: {} as Record<string, number>, exists: false },
    summary: {
      spendingCents: 0,
      incomeCents: 0,
      yourShareCents: 0,
      categorySpending: {} as Record<string, number>,
    },
  };
  for (const row of rows) {
    result.budget.poolCents += row.budget.poolCents;
    result.budget.exists ||= row.budget.exists;
    result.summary.spendingCents += row.summary.spendingCents;
    result.summary.incomeCents += row.summary.incomeCents;
    result.summary.yourShareCents += row.summary.yourShareCents;
    for (const [id, cents] of Object.entries(row.budget.allocations))
      result.budget.allocations[id] = (result.budget.allocations[id] ?? 0) + cents;
    for (const [id, cents] of Object.entries(row.summary.categorySpending))
      result.summary.categorySpending[id] = (result.summary.categorySpending[id] ?? 0) + cents;
  }
  return result;
}
