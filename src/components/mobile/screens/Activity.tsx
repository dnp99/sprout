"use client";

import { MonthStepper } from "@/components/shared/MonthStepper";
import { StatCard } from "@/components/ui/StatCard";
import { TransactionCard } from "@/components/ui/rows";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { monthTotals, resolveViewMonth } from "@/lib/trends";
import { useStore } from "@/state/store";

export function Activity() {
  const { transactions, viewMonthKey, goMobile, openTransaction } = useStore();
  const monthKey = resolveViewMonth(viewMonthKey, transactions);
  const rows = filterTransactions(transactions, { monthKey });
  const { spentCents, incomeCents } = monthTotals(transactions, monthKey);

  return (
    <div className="px-[22px] pt-3">
      <h1 className="text-[22px] font-extrabold text-ink">Activity</h1>

      <button
        type="button"
        onClick={() => goMobile("search")}
        className="mt-3.5 w-full rounded-2xl bg-card px-4 py-2.5 text-left text-[13px] font-semibold text-subtle"
      >
        🔍 Search…
      </button>

      <div className="mt-3.5 flex justify-center">
        <MonthStepper />
      </div>

      <div className="mt-3 flex gap-2.5">
        <StatCard label="Spent" value={formatMoney(spentCents)} className="flex-1" />
        <StatCard
          label="Income"
          value={formatMoney(incomeCents)}
          variant="income"
          className="flex-1"
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 text-center text-sm font-semibold text-muted">
          No transactions this month.
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
