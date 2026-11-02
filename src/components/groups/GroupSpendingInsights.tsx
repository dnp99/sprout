"use client";

import { groupCategoryLabel } from "@/lib/groups/category-tree";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { Category } from "@/lib/types";
import { SHARED_PAYER, type SpendingRecord } from "@/lib/overview-insights";
import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { groupFeatureTransactions } from "@/lib/groups/feature-dto";
import { GroupMobileTrends, type GroupTrendControls } from "./GroupMobileTrends";
import { payerChartColor } from "@/lib/chart-colors";

/** Preserve actual payer identity and signed refunds; shares/author IDs are
 * never substitutes for who paid. The complete authorized ledger is required. */
export function GroupSpendingInsights({
  data,
  month,
  onMonthChange,
  mobileTrends,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
  mobileTrends?: GroupTrendControls;
}) {
  const t = useTranslations("groups");
  const source = useMemo(() => {
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
      { id: SHARED_PAYER, name: t("sharedFunds"), color: "var(--chart-brand, var(--primary-ink))" },
    ];
    const payerById = new Map((data.reportEntries ?? []).map((row) => [row.id, row.payerId]));
    const transactions: SpendingRecord[] = groupFeatureTransactions({
      ...data,
      reportEntries: data.reportEntries ?? [],
    }).map((row) => {
      return {
        ...row,
        categoryName: groupCategoryLabel(data.categories, row.categoryId) || t("uncategorized"),
        payerId: payerById.get(row.id) ?? null,
      };
    });
    return { transactions, categories, payers, month, onMonthChange, loading: !data.reportEntries };
  }, [data, month, onMonthChange, t]);
  if (!mobileTrends) return <OverviewSpendingInsights source={source} />;
  return (
    <>
      <div className="lg:hidden">
        <GroupMobileTrends data={data} source={source} controls={mobileTrends} />
      </div>
      <div className="hidden lg:block">
        <OverviewSpendingInsights source={source} />
      </div>
    </>
  );
}
