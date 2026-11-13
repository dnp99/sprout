"use client";

import { useState } from "react";
import { useStore } from "@/state/store";
import { EverydayCalendar, type CalendarCardLayout } from "./EverydayCalendar";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import { expenseContributionCents } from "@/lib/transactions/reimbursement";
import { monthSearchBounds } from "@/lib/search-dates";
import { personalAdvancedReset } from "@/state/transaction-filters";
import { groupToday } from "@/lib/groups/navigation";

/** The calendar reads the complete personal ledger, never the table's search
 * results. Existing add/edit flows remain the single mutation path. */
export function PersonalCalendar({
  compact = false,
  dashboard = false,
  renderCards,
  month: controlledMonth,
  onMonthChange,
}: {
  compact?: boolean;
  dashboard?: boolean;
  renderCards?: CalendarCardLayout;
  month?: string;
  onMonthChange?: (month: string) => void;
}) {
  const transactions = useStore((s) => s.transactions);
  const loading = useStore((s) => s.transactionsLoading);
  const set = useStore((s) => s.set);
  const goMobile = useStore((s) => s.goMobile);
  const openTransaction = useStore((s) => s.openTransaction);
  const [localMonth, setMonth] = useState(() => groupToday().slice(0, 7));
  const month = controlledMonth ?? localMonth;
  return (
    <EverydayCalendar
      dashboard={dashboard}
      renderCards={renderCards}
      month={month}
      onMonthChange={onMonthChange ?? setMonth}
      loading={loading}
      records={transactions.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        note: row.note,
        date: occurredAtInputValue(row.occurredAt),
        name: row.merchant,
        emoji: row.emoji,
        category: row.categoryName,
        amountCents: row.amountCents,
        spendingCents: row.excludeFromBudget ? 0 : expenseContributionCents(row),
        incomeCents: !row.excludeFromBudget && row.isIncome ? row.amountCents : 0,
      }))}
      onEdit={(id) => (compact ? openTransaction(id) : set({ webEditTxnId: id }))}
      onViewAll={() => {
        const bounds = monthSearchBounds(month);
        set({
          ...personalAdvancedReset(compact),
          viewMonthKey: month,
          webTxnType: "all",
          webTxnQuickType: "all",
          mobileTxnScope: "all",
          searchType: "all",
          webTxnQuery: "",
          searchQuery: "",
          webDateFrom: bounds.from,
          webDateTo: bounds.to,
          searchDateFrom: bounds.from,
          searchDateTo: bounds.to,
        });
        if (compact) goMobile("history");
        else set({ webView: "transactions" });
      }}
    />
  );
}
