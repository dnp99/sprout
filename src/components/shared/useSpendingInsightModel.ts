"use client";

import { useMemo, useState } from "react";
import {
  ALL_CATEGORIES,
  buildOverviewInsights,
  type SpendingDimension,
  type SpendingPayer,
  type SpendingRecord,
} from "@/lib/overview-insights";
import type { OverviewComparisonPreset } from "@/lib/overview-comparison";
import type { Category } from "@/lib/types";

export type SpendingInsightFilters = {
  dimension: SpendingDimension;
  payer: string;
  category: string;
  preset: OverviewComparisonPreset;
  throughDate?: string;
};
export const DEFAULT_INSIGHT_FILTERS: SpendingInsightFilters = {
  dimension: "category",
  payer: ALL_CATEGORIES,
  category: ALL_CATEGORIES,
  preset: "month-vs-last-month",
};

/** One filter/model boundary keeps Overview and Group detail on identical scopes.
 * Explicit inputs isolate ledger state; filter sheets can stage a complete draft. */
export function useSpendingInsightModel(
  transactions: SpendingRecord[],
  categories: Category[],
  payers: SpendingPayer[],
  month: string,
) {
  const [filters, setFilters] = useState<SpendingInsightFilters>(DEFAULT_INSIGHT_FILTERS);
  const model = useMemo(
    () =>
      buildOverviewInsights(
        transactions,
        categories,
        month,
        filters.preset,
        filters.category,
        new Date(),
        { ...filters, payers },
      ),
    [transactions, categories, payers, month, filters],
  );
  const setFilter = <K extends keyof SpendingInsightFilters>(
    key: K,
    value: SpendingInsightFilters[K],
  ) => setFilters((current) => ({ ...current, [key]: value }));
  const selectRow = (id: string) => {
    const key = filters.dimension === "payer" ? "payer" : "category";
    setFilter(key, filters[key] === id ? ALL_CATEGORIES : id);
  };
  return { filters, setFilters, model, selectRow, setFilter };
}
