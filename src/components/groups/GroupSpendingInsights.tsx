"use client";

import { groupCategoryLabel } from "@/lib/groups/category-tree";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { Category } from "@/lib/types";
import { SHARED_PAYER, type SpendingRecord } from "@/lib/overview-insights";
import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";

/** Preserve actual payer identity and signed refunds; shares/author IDs are
 * never substitutes for who paid. The complete authorized ledger is required. */
export function GroupSpendingInsights({
  data,
  month,
  onMonthChange,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
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
        color:
          data.categories[index % Math.max(1, data.categories.length)]?.color ??
          "var(--primary-ink)",
      })),
      { id: SHARED_PAYER, name: t("sharedFunds"), color: "var(--chart-brand, var(--primary-ink))" },
    ];
    const transactions: SpendingRecord[] = (data.reportEntries ?? []).map((row) => {
      const category = data.categories.find((item) => item.id === row.categoryId);
      return {
        id: row.id,
        merchant: row.merchant,
        emoji: category?.emoji ?? "🏷",
        categoryId: row.categoryId,
        categoryName: groupCategoryLabel(data.categories, row.categoryId) || t("uncategorized"),
        payerId: row.payerId,
        amountCents: row.amountCents,
        note: row.note,
        occurredAt: row.occurredOn + "T12:00:00Z",
        isIncome: row.kind === "income",
        method: "",
        status: "posted",
        dateLabel: row.occurredOn,
      };
    });
    return { transactions, categories, payers, month, onMonthChange, loading: !data.reportEntries };
  }, [data, month, onMonthChange, t]);
  return <OverviewSpendingInsights source={source} />;
}
