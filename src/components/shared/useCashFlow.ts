"use client";

import { useMemo, useState } from "react";
import {
  cashFlowSummary,
  expenseByGroup,
  incomeByCategory,
  merchantBreakdown,
  monthlyCashFlow,
  projectMonthPace,
} from "@/lib/cash-flow";
import { periodMonthKeys } from "@/lib/reports";
import { categoryBreakdown, latestMonthKey, monthKeyOf } from "@/lib/trends";
import type { RecurringItem, Transaction } from "@/lib/types";

/** Shared cash-flow derivation for the web + mobile Trends views (plan 012), so
 *  they render identical numbers. Fixed 6-month window ending at the latest month
 *  with data (locked decision: cash flow doesn't share the spending period
 *  control in v1); the selected month drives the summary + breakdowns and can be
 *  changed by tapping a bar. */
export function useCashFlow(transactions: Transaction[], recurring: RecurringItem[] = []) {
  const keys = useMemo(() => periodMonthKeys("6m", latestMonthKey(transactions)), [transactions]);
  const series = useMemo(() => monthlyCashFlow(transactions, keys), [transactions, keys]);

  const latestKey = keys[keys.length - 1];
  const [picked, setPicked] = useState<string | null>(null);
  const selectedKey = picked && keys.includes(picked) ? picked : latestKey;
  const selected = series.find((m) => m.key === selectedKey) ?? series[series.length - 1];

  const summary = cashFlowSummary(selected);
  const incomeCats = useMemo(
    () => incomeByCategory(transactions, selectedKey),
    [transactions, selectedKey],
  );
  const expenseCats = useMemo(
    () => categoryBreakdown(transactions, selectedKey),
    [transactions, selectedKey],
  );
  const incomeMerchants = useMemo(
    () => merchantBreakdown(transactions, selectedKey, true),
    [transactions, selectedKey],
  );
  const expenseMerchants = useMemo(
    () => merchantBreakdown(transactions, selectedKey, false),
    [transactions, selectedKey],
  );
  // Expenses collapsed into Fixed / Flexible (the Group option — expense-only).
  const expenseGroups = useMemo(
    () => expenseByGroup(transactions, selectedKey, recurring),
    [transactions, selectedKey, recurring],
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
    if (next) setPicked(next);
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
    setPicked,
    stepMonth,
    canPrev: idx > 0,
    canNext: idx < keys.length - 1,
  };
}
