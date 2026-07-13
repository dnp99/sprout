"use client";

import { useMemo, useState } from "react";
import { cashFlowSummary, incomeByCategory, monthlyCashFlow } from "@/lib/cash-flow";
import { periodMonthKeys } from "@/lib/reports";
import { categoryBreakdown, latestMonthKey } from "@/lib/trends";
import type { Transaction } from "@/lib/types";

/** Shared cash-flow derivation for the web + mobile Trends views (plan 012), so
 *  they render identical numbers. Fixed 6-month window ending at the latest month
 *  with data (locked decision: cash flow doesn't share the spending period
 *  control in v1); the selected month drives the summary + breakdowns and can be
 *  changed by tapping a bar. */
export function useCashFlow(transactions: Transaction[]) {
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

  return { series, selectedKey, summary, incomeCats, expenseCats, setPicked };
}
