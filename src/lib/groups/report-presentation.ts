import type { Transaction } from "@/lib/types";

/** Group report dates are financial date-only values adapted at noon UTC.
 * Compare UTC calendar days, as the report engines do, rather than browser zones.
 * This metadata changes presentation only; signed report totals stay untouched. */
export function futureReportPoints(
  transactions: Transaction[],
  pointKeys: string[],
  now = new Date(),
) {
  const today = now.toISOString().slice(0, 10);
  const daily = pointKeys[0]?.length === 10;
  const window = new Set(pointKeys);
  const future = transactions.filter(
    (row) =>
      !row.excludeFromBudget &&
      row.occurredAt.slice(0, 10) > today &&
      window.has(row.occurredAt.slice(0, daily ? 10 : 7)),
  );
  return {
    count: future.length,
    keys: [
      ...new Set(
        future.filter((row) => !row.isIncome).map((row) => row.occurredAt.slice(0, daily ? 10 : 7)),
      ),
    ],
  };
}
