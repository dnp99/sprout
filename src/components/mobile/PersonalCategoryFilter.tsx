"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import type { Transaction } from "@/lib/types";
import { UNASSIGNED_INCOME_SOURCE } from "@/lib/search";
import { categoryLabel } from "@/lib/categories/labels";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { TransactionFilterRail } from "@/components/web/TransactionFilterRail";

/** Counts consume the very same scope as the phone ledger before its category
 * and source filters. Selection only changes that dimension, never date/query. */
export function PersonalCategoryFilter({
  rows,
  income,
  sourceId,
  onSource,
}: {
  rows: Transaction[];
  income: boolean;
  sourceId: string;
  onSource: (id: string) => void;
}) {
  const t = useTranslations("txns");
  const { categories, sources, activeId, selectedIds, set } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      sources: s.incomeSources,
      activeId: s.txnCategory,
      selectedIds: s.searchCategoryIds,
      set: s.set,
    })),
  );
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const row of rows) {
      const id = income ? (row.incomeSourceId ?? UNASSIGNED_INCOME_SOURCE) : row.categoryId;
      if (id) result.set(id, (result.get(id) ?? 0) + 1);
    }
    return result;
  }, [rows, income]);
  return (
    <TransactionFilterRail
      key={income ? "income" : "categories"}
      mobile
      title={t(income ? "incomeSourcesLabel" : "categoriesLabel")}
      description=""
      allLabel={t(income ? "allIncomeSources" : "allCategories")}
      items={
        income
          ? [
              {
                id: UNASSIGNED_INCOME_SOURCE,
                label: t("unassignedIncome"),
                icon: <EntitySymbol emoji="💰" />,
              },
              ...sources.map((source) => ({
                id: source.id,
                label: source.name,
                icon: <EntitySymbol emoji={source.emoji} />,
              })),
            ]
          : categories.map((category) => ({
              id: category.id,
              label: category.name,
              parentId: category.parentId,
              accessibleLabel: categoryLabel(categories, category),
              icon: <EntitySymbol emoji={category.emoji} color={category.color} />,
            }))
      }
      selectedIds={income ? undefined : selectedIds}
      activeId={income ? sourceId : activeId}
      totalCount={rows.length}
      counts={counts}
      onSelect={(id) =>
        income
          ? onSource(id)
          : set({
              txnCategory: id,
              searchCategoryId: id,
              searchCategoryIds: id === "all" ? [] : [id],
            })
      }
      collapsed={false}
      onToggleCollapsed={() => {}}
      collapseLabel={t("collapseCategories")}
      expandLabel={t("expandCategories")}
    />
  );
}
