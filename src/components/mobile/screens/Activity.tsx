"use client";

import { StatCard } from "@/components/ui/StatCard";
import { TransactionCard } from "@/components/ui/rows";
import type { Transaction } from "@/lib/types";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";

/** Bucket transactions into Today / Yesterday / Earlier this month. */
function group(transactions: Transaction[]): { label: string; items: Transaction[] }[] {
  const buckets: Record<string, Transaction[]> = {
    Today: [],
    Yesterday: [],
    "Earlier this month": [],
  };
  for (const t of transactions) {
    const key =
      t.dateLabel === "Today"
        ? "Today"
        : t.dateLabel === "Yesterday"
          ? "Yesterday"
          : "Earlier this month";
    buckets[key].push(t);
  }
  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }));
}

export function Activity() {
  const { transactions, summary, goMobile, openTransaction } = useStore();
  const groups = group(transactions);

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

      <div className="mt-3.5 flex items-center justify-between rounded-2xl bg-card px-3 py-2.5">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-bg text-lg text-muted">
          ‹
        </span>
        <span className="text-sm font-extrabold text-ink">{summary.monthLabel}</span>
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-bg text-lg text-muted">
          ›
        </span>
      </div>

      <div className="mt-3 flex gap-2.5">
        <StatCard label="Spent" value={formatMoney(summary.spentCents)} className="flex-1" />
        <StatCard
          label="Income"
          value={formatMoney(summary.incomeCents)}
          variant="income"
          className="flex-1"
        />
      </div>

      {groups.map((section) => (
        <div key={section.label}>
          <div className="mt-[18px] text-xs font-extrabold uppercase tracking-wide text-muted">
            {section.label}
          </div>
          <div className="mt-2.5 flex flex-col gap-2.5">
            {section.items.map((txn) => (
              <TransactionCard
                key={txn.id}
                txn={txn}
                showDate={false}
                onClick={() => openTransaction(txn.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
