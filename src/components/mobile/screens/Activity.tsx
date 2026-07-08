"use client";

import { useState } from "react";
import { MonthStepper } from "@/components/shared/MonthStepper";
import { StatCard } from "@/components/ui/StatCard";
import { Chip } from "@/components/ui/controls";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import { ALL_MONTHS_FILTERS, TXN_TYPE_CHIPS, filterTransactions } from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import type { TxnFilter } from "@/lib/types";
import { useStore } from "@/state/store";

export function Activity() {
  const { transactions, viewMonthKey, goMobile, openTransaction } = useStore();
  const [type, setType] = useState<TxnFilter>("all");

  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  // Uncategorized/Excluded are a whole-backlog review, so they ignore the month.
  const allMonths = ALL_MONTHS_FILTERS.has(type);
  const rows = filterTransactions(transactions, {
    type,
    monthKey: allMonths ? undefined : monthKey,
  });
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const { spentCents, incomeCents } = monthTotals(transactions, monthKey);

  return (
    <div className="px-[22px] pt-3">
      <h1 className="text-[22px] font-extrabold text-ink">Transactions</h1>

      {/* Search + month selector share one row (search ~70%, month ~30%). The
          month collapses for whole-backlog filters, letting search fill. */}
      <div className="mt-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => goMobile("search")}
          className="flex-[7] rounded-2xl bg-card px-4 py-2.5 text-left text-[13px] font-semibold text-subtle"
        >
          🔍 Search…
        </button>
        {!allMonths && <MonthStepper compact className="flex-[3]" />}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {TXN_TYPE_CHIPS.map((chip) => (
          <Chip key={chip.value} active={type === chip.value} onClick={() => setType(chip.value)}>
            {chip.label}
            {chip.value === "uncategorized" && uncategorizedCount > 0
              ? ` (${uncategorizedCount})`
              : ""}
          </Chip>
        ))}
      </div>

      {/* Spent/Income summary applies only to month-scoped filters. */}
      {!allMonths && (
        <div className="mt-3 flex gap-2.5">
          <StatCard label="Spent" value={formatMoney(spentCents)} className="flex-1" />
          <StatCard
            label="Income"
            value={formatMoney(incomeCents)}
            variant="income"
            className="flex-1"
          />
        </div>
      )}

      {rows.length === 0 ? (
        <div className="mt-8 text-center text-sm font-semibold text-muted">
          No transactions{allMonths ? "" : " this month"}.
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-2.5">
          {rows.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
