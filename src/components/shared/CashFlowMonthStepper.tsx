"use client";

import { useMemo } from "react";
import { MonthSelector } from "@/components/shared/MonthSelector";
import { cashFlowWindowKeys, selectedCashFlowMonthKey } from "@/lib/cash-flow";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";

/** Header control for Cash Flow's focused month. The six-month range is
 *  deliberate; this selects the month used by the summary and breakdowns, not
 *  the range shown by the chart. */
export function CashFlowMonthStepper({ compact = false }: { compact?: boolean }) {
  const { transactions, cashFlowMonthKey, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      cashFlowMonthKey: s.cashFlowMonthKey,
      set: s.set,
    })),
  );
  const keys = useMemo(() => cashFlowWindowKeys(transactions), [transactions]);
  const selectedKey = selectedCashFlowMonthKey(keys, cashFlowMonthKey);
  const index = keys.indexOf(selectedKey);
  const fmt = useFormatters();
  const [year, month] = selectedKey.split("-").map(Number);
  const label = compact
    ? fmt.shortMonthYear(new Date(Date.UTC(year, month - 1, 1)))
    : fmt.monthKey(selectedKey);

  const step = (delta: number) => {
    const next = keys[index + delta];
    if (next) set({ cashFlowMonthKey: next });
  };

  return (
    <MonthSelector
      label={label}
      onPrevious={() => step(-1)}
      onNext={() => step(1)}
      previousDisabled={index <= 0}
      nextDisabled={index < 0 || index >= keys.length - 1}
      previousTitle={fmt.monthKey(keys[index - 1] ?? selectedKey)}
      nextTitle={fmt.monthKey(keys[index + 1] ?? selectedKey)}
      compact={compact}
      icon={compact ? "none" : "calendar"}
    />
  );
}
