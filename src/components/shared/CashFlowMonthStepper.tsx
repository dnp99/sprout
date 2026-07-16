"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
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
    <div
      className={
        compact
          ? "flex items-center rounded-[10px] border border-edge text-[11px] font-semibold text-muted"
          : "flex items-center gap-1.5"
      }
    >
      <MonthArrow
        compact={compact}
        direction="prev"
        disabled={index <= 0}
        label={label}
        onClick={() => step(-1)}
      />
      <span
        className={`text-center font-bold tabular-nums text-ink ${
          compact ? "min-w-[104px] px-1 text-[11px]" : "min-w-[128px] text-[15px]"
        }`}
      >
        {label}
      </span>
      <MonthArrow
        compact={compact}
        direction="next"
        disabled={index < 0 || index >= keys.length - 1}
        label={label}
        onClick={() => step(1)}
      />
    </div>
  );
}

function MonthArrow({
  compact,
  direction,
  disabled,
  label,
  onClick,
}: {
  compact: boolean;
  direction: "prev" | "next";
  disabled: boolean;
  label: string;
  onClick: () => void;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={
        direction === "prev" ? `Previous month before ${label}` : `Next month after ${label}`
      }
      onClick={onClick}
      className={`flex flex-none items-center justify-center text-muted transition hover:text-ink disabled:pointer-events-none disabled:opacity-40 ${
        compact
          ? "h-11 w-9 rounded-lg hover:bg-track active:bg-track"
          : "h-8 w-8 rounded-[9px] border border-edge"
      }`}
    >
      <Icon size={compact ? 18 : 16} strokeWidth={compact ? 2 : 2.2} />
    </button>
  );
}
