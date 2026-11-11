import { ALL_CATEGORIES, type OverviewInsights } from "@/lib/overview-insights";
import { buildMoneyAxis } from "@/lib/chart-axis";
import type { OverviewSpendingComparison } from "@/lib/overview-comparison";
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

/** Palette slots are tied to the unfiltered identity catalog, not spend rank.
 * Shared ring/legend colors can then change with theme without changing data. */
export function groupInsightColors(model: OverviewInsights, identities: string[]) {
  const ids = [...new Set(identities)];
  const color = (id: string) =>
    `var(--chart-category-${(Math.max(0, ids.indexOf(id)) % 6) + 1}, var(--primary-ink))`;
  return {
    ...model,
    rows: model.rows.map((row) => ({ ...row, color: color(row.id) })),
    slices: model.slices.map((row) => ({ ...row, color: color(row.id) })),
  };
}

/** All filters other than the month anchor are explicit analytical choices. */
export function insightFilterCount(filters: {
  preset: string;
  dimension: string;
  payer: string;
  category: string;
  throughDate?: string;
}) {
  return (
    Number(filters.preset !== "month-vs-last-month") +
    Number(filters.dimension !== "category") +
    Number(filters.payer !== ALL_CATEGORIES) +
    Number(filters.category !== ALL_CATEGORIES) +
    Number(!!filters.throughDate)
  );
}

/** Group detail always compares cumulative values, including a genuine zero
 * baseline. Re-scale visible points only; never alter either period's cents. */
export function groupCumulativeComparison(
  comparison: OverviewSpendingComparison,
): OverviewSpendingComparison {
  const visible = comparison.points.slice(0, comparison.visiblePointCount);
  const maxCents = Math.max(
    1,
    ...visible.flatMap((point) => [point.currentCents, point.compareCents]),
  );
  const axis = buildMoneyAxis(maxCents, 4);
  return {
    ...comparison,
    chartMode: "comparison",
    maxCents,
    axisMaxCents: axis.maxCents,
    yTicks: axis.ticks,
  };
}

/** Match the period engine's same-progress boundary, clamping short prior months.
 * Year comparisons advance by whole months rather than implying a daily cutoff. */
export function groupComparisonCutoff(month: string, yearly: boolean, cutoff: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  if (yearly) return `${year - 1}-${month.slice(5)}`;
  const lastDay = new Date(Date.UTC(year, monthNumber - 1, 0));
  return `${lastDay.toISOString().slice(0, 7)}-${String(Math.min(Number(cutoff.slice(8)), lastDay.getUTCDate())).padStart(2, "0")}`;
}

/** Reporting ranges for labels only. Values and cutoffs remain engine-owned. */
export function groupComparisonRanges(month: string, preset: string, cutoff: string) {
  if (preset === "year-vs-last-year") {
    const [year, m] = month.split("-").map(Number);
    return {
      selected: [`${year}-01-01`, new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10)],
      comparison: [
        `${year - 1}-01-01`,
        new Date(Date.UTC(year - 1, m, 0)).toISOString().slice(0, 10),
      ],
    };
  }
  const previous = groupComparisonCutoff(month, false, cutoff);
  return {
    selected: [`${month}-01`, cutoff],
    comparison:
      preset === "month-vs-last-month" ? [`${previous.slice(0, 7)}-01`, previous] : undefined,
  };
}
