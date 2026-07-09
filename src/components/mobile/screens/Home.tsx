"use client";

import { AlertCircle, ChevronRight, NotebookText, TrendingDown } from "lucide-react";
import { useMemo } from "react";
import { BarChart } from "@/components/ui/BarChart";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { monthlyBillsTotalCents } from "@/lib/bills";
import { formatMoney, spentPercent } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { monthlyTrend, topRecurringMerchants, toTrendPoints, trendTooltips } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Home() {
  const {
    categories,
    recurring,
    transactions,
    transactionsLoading,
    summary,
    set,
    goMobile,
    openTransaction,
  } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      recurring: s.recurring,
      transactions: s.transactions,
      transactionsLoading: s.transactionsLoading,
      summary: s.summary,
      set: s.set,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
    })),
  );
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);
  const dueThisMonthCents = monthlyBillsTotalCents(recurring);
  // Feature the top spenders this month (real data — no fixed category ids).
  const homeCategories = [...categories].sort((a, b) => b.spentCents - a.spentCents).slice(0, 4);
  const recent = transactions.slice(0, 5);

  // Frequent-habit merchants over the rolling last 30 days.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 5), [transactions]);

  // Spending trend (bottom of the page), mirroring the web Overview.
  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const current = months[months.length - 1];
  const trendPoints = toTrendPoints(months, current?.key ?? "");
  const tooltips = trendTooltips(months);

  return (
    <div className="px-4 pt-3">
      {/* Stat tiles mirror the desktop Overview: a filled "Safe to spend" hero
          tile (taps into the budget editor) plus outlined Spent / Saved / Income
          totals. A two-tone bar under the hero shows spent vs. still-safe. */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => goMobile("budget")}
          className="col-span-2 rounded-[14px] bg-primary p-4 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-onprimary/80">
              Safe to spend
            </div>
            <div className="text-[11px] font-semibold text-onprimary/80">
              {summary.daysLeft} days left
            </div>
          </div>
          <div className="mt-1 text-[26px] font-bold tabular-nums leading-none text-onprimary">
            {formatMoney(summary.safeToSpendCents)}
          </div>
          {/* Two-tone bar: darker = spent, lighter track = still safe to spend. */}
          <div className="mt-3.5 flex h-2 items-stretch gap-1 overflow-hidden rounded-full bg-onprimary/25">
            <div
              className="rounded-full bg-onprimary"
              style={{ width: `${Math.max(budgetPercent, 4)}%` }}
            />
          </div>
        </button>

        <StatTile label="Spent" value={formatMoney(summary.spentCents)} />
        <StatTile
          label="Saved"
          value={formatMoney(summary.savedCents)}
          valueClassName="text-green"
        />
        <StatTile
          label="Income"
          value={formatMoney(summary.incomeCents)}
          valueClassName="text-green"
          className="col-span-2"
        />
      </div>

      <button
        type="button"
        onClick={() => goMobile("bills")}
        className="mt-3 flex w-full items-center gap-3 rounded-[14px] border border-edge px-4 py-3 text-left"
      >
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-track text-primary">
          <NotebookText size={18} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-semibold text-ink">Bills</div>
          <div className="mt-0.5 text-[11px] font-medium text-muted">
            {recurring.length === 0
              ? "Track recurring bills and subscriptions"
              : `${formatMoney(dueThisMonthCents, { forceCents: true })} due this month`}
          </div>
        </div>
        <ChevronRight size={16} strokeWidth={2} className="flex-none text-muted" />
      </button>

      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() =>
            set({ searchType: "uncategorized", txnCategory: "all", mobileScreen: "history" })
          }
          className="mt-3 flex w-full items-center gap-2.5 rounded-[12px] border border-soft-border bg-primary-soft px-3.5 py-3 text-left"
        >
          <AlertCircle size={16} strokeWidth={2} className="flex-none text-primary" />
          <span className="flex-1 text-[12.5px] font-semibold leading-snug text-primary">
            {uncategorizedCount} transactions need a category
          </span>
          <span className="flex-none text-[12px] font-semibold text-primary">Review ›</span>
        </button>
      )}

      {transactionsLoading ? (
        <>
          <SectionHeader title="Frequent spots" className="mt-6" />
          <div className="mt-3 rounded-[14px] border border-edge p-4">
            <SkeletonRows rows={3} />
          </div>
        </>
      ) : (
        topMerch.length > 0 && (
          <>
            <SectionHeader title="Frequent spots" className="mt-6" />
            <div className="mt-3 rounded-[14px] border border-edge px-4 py-1.5">
              {topMerch.map((m, i) => (
                <div
                  key={m.name}
                  className={`flex items-center justify-between py-2 text-[12.5px] ${
                    i < topMerch.length - 1 ? "border-b border-edge" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-semibold text-ink">
                    {m.emoji} {m.name}
                    <span className="ml-1 font-medium text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 font-semibold tabular-nums text-primary">{m.count}×</span>
                </div>
              ))}
            </div>
          </>
        )
      )}

      <SectionHeader
        title="By category"
        action="See all ›"
        onAction={() => goMobile("categories")}
        className="mt-6"
      />
      <div className="mt-3 flex flex-col gap-3.5 rounded-[14px] border border-edge p-4">
        {homeCategories.map((category) => (
          <CategoryBar
            key={category.id}
            category={category}
            // Tap a category on the dashboard → its transactions for the month.
            onClick={() =>
              set({ txnCategory: category.id, searchType: "all", mobileScreen: "history" })
            }
          />
        ))}
      </div>

      <SectionHeader
        title="Recent transactions"
        action="View all ›"
        onAction={() => set({ searchType: "all", txnCategory: "all", mobileScreen: "history" })}
        className="mt-6"
      />
      <div className="mt-3 flex flex-col gap-2.5">
        {transactionsLoading ? (
          <SkeletonRows rows={5} className="gap-3" />
        ) : (
          recent.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-1.5">
        <h2 className="text-base font-bold text-ink">Spending trend</h2>
        <TrendingDown size={15} strokeWidth={2} className="text-green" />
      </div>
      <div className="mt-3 rounded-[14px] border border-edge p-4">
        {transactionsLoading ? (
          <Skeleton className="h-[140px] w-full" />
        ) : (
          <BarChart points={trendPoints} height={140} tooltips={tooltips} />
        )}
      </div>
    </div>
  );
}

/** One outlined KPI tile in the stat grid (shadcn-hybrid look). */
function StatTile({
  label,
  value,
  valueClassName,
  className,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[14px] border border-edge p-4 ${className ?? ""}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">{label}</div>
      <div className={`mt-1 text-[22px] font-bold tabular-nums text-ink ${valueClassName ?? ""}`}>
        {value}
      </div>
    </div>
  );
}
