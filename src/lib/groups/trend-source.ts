import type { Category } from "@/lib/types";
import { SHARED_PAYER, type SpendingRecord } from "@/lib/overview-insights";
import { payerChartColor } from "@/lib/chart-colors";
import type { GroupSnapshot } from "./dto";
import { groupFeatureTransactions } from "./feature-dto";
import { groupCategoryLabel } from "./category-tree";

/** Reports require the complete authorized history, never the paginated ledger.
 * Keep signed refunds and actual payer IDs identical in summary and detail. */
export function groupTrendSource(
  data: GroupSnapshot,
  labels: { uncategorized: string; sharedFunds: string },
) {
  const categories: Category[] = data.categories.map((row) => ({
    ...row,
    name: groupCategoryLabel(data.categories, row.id),
    monthlyBudgetCents: data.budget.allocations[row.id] ?? 0,
    spentCents: data.summary.categorySpending[row.id] ?? 0,
  }));
  const payers = [
    ...data.members.map((row, index) => ({
      id: row.id,
      name: row.name,
      color: payerChartColor(index),
    })),
    { id: SHARED_PAYER, name: labels.sharedFunds, color: "var(--chart-brand, var(--primary-ink))" },
  ];
  const payerById = new Map((data.reportEntries ?? []).map((row) => [row.id, row.payerId]));
  const transactions: SpendingRecord[] = groupFeatureTransactions({
    ...data,
    reportEntries: data.reportEntries ?? [],
  }).map((row) => ({
    ...row,
    categoryName: groupCategoryLabel(data.categories, row.categoryId) || labels.uncategorized,
    payerId: payerById.get(row.id) ?? null,
  }));
  return { transactions, categories, payers, loading: !data.reportEntries };
}
