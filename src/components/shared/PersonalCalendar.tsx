"use client";

import { useState } from "react";
import { useStore } from "@/state/store";
import { EverydayCalendar } from "./EverydayCalendar";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import { expenseContributionCents } from "@/lib/transactions/reimbursement";
import { groupToday } from "@/lib/groups/navigation";

/** The calendar reads the complete personal ledger, never the table's search
 * results. Existing add/edit flows remain the single mutation path. */
export function PersonalCalendar({ compact = false }: { compact?: boolean }) {
  const transactions = useStore((s) => s.transactions);
  const loading = useStore((s) => s.transactionsLoading);
  const set = useStore((s) => s.set);
  const resetAdd = useStore((s) => s.resetAdd);
  const goMobile = useStore((s) => s.goMobile);
  const openTransaction = useStore((s) => s.openTransaction);
  const [month, setMonth] = useState(() => groupToday().slice(0, 7));
  return (
    <EverydayCalendar
      month={month}
      onMonthChange={setMonth}
      loading={loading}
      records={transactions.map((row) => ({
        id: row.id,
        createdAt: row.createdAt,
        date: occurredAtInputValue(row.occurredAt),
        name: row.merchant,
        emoji: row.emoji,
        category: row.categoryName,
        amountCents: row.amountCents,
        spendingCents: row.excludeFromBudget ? 0 : expenseContributionCents(row),
        incomeCents: !row.excludeFromBudget && row.isIncome ? row.amountCents : 0,
      }))}
      onAdd={(date) => {
        resetAdd();
        set({ addOccurredAt: date });
        if (compact) goMobile("add");
        else set({ webAddOpen: true });
      }}
      onEdit={(id) => (compact ? openTransaction(id) : set({ webEditTxnId: id }))}
      onViewAll={() => {
        set({
          viewMonthKey: month,
          txnCategory: "all",
          webTxnQuery: "",
          webTxnType: "all",
          searchType: "all",
          webTxnCategoryIds: [],
          webDateFrom: "",
          webDateTo: "",
          webAmountMin: "",
          webAmountMax: "",
        });
        if (compact) goMobile("history");
        else set({ webView: "transactions" });
      }}
    />
  );
}
