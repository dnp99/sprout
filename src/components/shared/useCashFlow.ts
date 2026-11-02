"use client";

import { useMemo } from "react";
import {
  cashFlowSummary,
  expenseByGroup,
  incomeByCategory,
  merchantBreakdown,
  monthlyCashFlow,
  projectMonthPace,
  cashFlowWindowKeys,
  selectedCashFlowMonthKey,
  mergeCashFlowRows,
} from "@/lib/cash-flow";
import { categoryBreakdown, monthKeyOf } from "@/lib/trends";
import { periodMonthKeys, type TrendPeriod } from "@/lib/reports";
import type { Category, RecurringItem, Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Shared cash-flow derivation for the web + mobile Trends views (plan 012), so
 *  they render identical numbers. Fixed 6-month window ending at the latest month
 *  with data; the shared focused-month selection drives the summary + breakdowns
 *  and can be changed from the chart, mobile stepper, or desktop header. */
export interface CashFlowScope {
  categories: Category[];
  month: string;
  onMonthChange: (month: string) => void;
  period?: TrendPeriod;
}

export function useCashFlow(
  transactions: Transaction[],
  recurring: RecurringItem[] = [],
  scope?: CashFlowScope,
) {
  const {
    cashFlowMonthKey,
    categories: personalCategories,
    set,
  } = useStore(
    useShallow((s) => ({
      cashFlowMonthKey: s.cashFlowMonthKey,
      categories: s.categories,
      set: s.set,
    })),
  );
  const categories = scope?.categories ?? personalCategories;
  const pickMonth = (key: string) =>
    scope ? scope.onMonthChange(key) : set({ cashFlowMonthKey: key });
  const scopedMonth = scope?.month;
  const scopedPeriod = scope?.period;
  const keys = useMemo(() => {
    if (scopedPeriod && scopedMonth) return periodMonthKeys(scopedPeriod, scopedMonth);
    const baseline = cashFlowWindowKeys(transactions);
    // Group's date picker also supports empty/older months. Keep its visible
    // month and report aligned instead of silently showing the latest activity.
    return scopedMonth && !baseline.includes(scopedMonth)
      ? periodMonthKeys("6m", scopedMonth)
      : baseline;
  }, [transactions, scopedMonth, scopedPeriod]);
  const series = useMemo(() => monthlyCashFlow(transactions, keys), [transactions, keys]);

  const selectedKey = selectedCashFlowMonthKey(keys, scope?.month ?? cashFlowMonthKey);
  const selected = series.find((m) => m.key === selectedKey) ?? series[series.length - 1];

  const summary = cashFlowSummary(
    scopedPeriod
      ? {
          incomeCents: series.reduce((sum, row) => sum + row.incomeCents, 0),
          expenseCents: series.reduce((sum, row) => sum + row.expenseCents, 0),
        }
      : selected,
  );
  const breakdownKeys = useMemo(
    () => (scopedPeriod ? keys : [selectedKey]),
    [scopedPeriod, keys, selectedKey],
  );
  const incomeCats = useMemo(
    () => mergeCashFlowRows(breakdownKeys.map((key) => incomeByCategory(transactions, key))),
    [transactions, breakdownKeys],
  );
  const expenseCats = useMemo(
    () => mergeCashFlowRows(breakdownKeys.map((key) => categoryBreakdown(transactions, key))),
    [transactions, breakdownKeys],
  );
  const incomeMerchants = useMemo(
    () => mergeCashFlowRows(breakdownKeys.map((key) => merchantBreakdown(transactions, key, true))),
    [transactions, breakdownKeys],
  );
  const expenseMerchants = useMemo(
    () =>
      mergeCashFlowRows(breakdownKeys.map((key) => merchantBreakdown(transactions, key, false))),
    [transactions, breakdownKeys],
  );
  // Expenses collapsed into Fixed / Flexible (the Group option — expense-only).
  const expenseGroups = useMemo(
    () =>
      mergeCashFlowRows(
        breakdownKeys.map((key) => expenseByGroup(transactions, key, recurring, categories)),
      ),
    [transactions, breakdownKeys, recurring, categories],
  );

  // Pace projection for the in-progress month, drawn as a dashed ghost on its
  // expense bar. Tied to the real current month (not the selection), so it shows
  // on whichever bar is still filling up. Null when the window has no live month.
  const projection = useMemo(() => {
    const now = new Date();
    const cur = series.find((m) => m.key === monthKeyOf(now.toISOString()));
    return cur ? projectMonthPace(cur, now) : null;
  }, [series]);

  // Step the focused month within the fixed window (drives the month stepper).
  const idx = keys.indexOf(selectedKey);
  const stepMonth = (delta: number) => {
    const next = keys[idx + delta];
    if (next) pickMonth(next);
  };

  return {
    keys,
    series,
    selectedKey,
    summary,
    incomeCats,
    expenseCats,
    incomeMerchants,
    expenseMerchants,
    expenseGroups,
    projection,
    setPicked: pickMonth,
    stepMonth,
    canPrev: idx > 0,
    canNext: idx < keys.length - 1,
  };
}
