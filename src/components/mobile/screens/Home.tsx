"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BarChart } from "@/components/ui/BarChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { formatMoney, spentPercent } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { monthlyTrend, topRecurringMerchants, toTrendPoints } from "@/lib/trends";
import { useStore } from "@/state/store";

export function Home() {
  const {
    user,
    categories,
    transactions,
    transactionsLoading,
    summary,
    set,
    goMobile,
    openCategory,
    openTransaction,
  } = useStore();
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const leftCents = summary.budgetCents - summary.spentCents;
  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);
  // Feature the top spenders this month (real data — no fixed category ids).
  const homeCategories = [...categories].sort((a, b) => b.spentCents - a.spentCents).slice(0, 4);
  const recent = transactions.slice(0, 5);

  // Frequent-habit merchants over the rolling last 30 days.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 5), [transactions]);

  // Spending trend (bottom of the page), mirroring the web Overview.
  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const current = months[months.length - 1];
  const trendPoints = toTrendPoints(months, current?.key ?? "");
  const trendTooltips = months.map((m) => `${m.label} · ${formatMoney(m.spentCents)}`);

  return (
    <div className="px-[22px] pt-3">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Hey {user.greetingName} 👋</h1>
          <p className="mt-0.5 text-[12.5px] font-medium text-muted">
            You&rsquo;re doing great this month
          </p>
        </div>
        <button type="button" aria-label="Account & settings" onClick={() => goMobile("settings")}>
          <Avatar size={42} />
        </button>
      </header>

      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() => set({ searchType: "uncategorized", mobileScreen: "history" })}
          className="mt-4 flex w-full items-center justify-between rounded-2xl bg-[#fbeee2] px-4 py-3 text-left"
        >
          <span className="text-[13px] font-extrabold text-primary-dark">
            🏷️ {uncategorizedCount} to categorize
          </span>
          <span className="text-[12px] font-extrabold text-primary">Review ›</span>
        </button>
      )}

      <section className="mt-6">
        <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
          Safe to spend
        </div>
        <div className="mt-1 text-[42px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
          {formatMoney(summary.safeToSpendCents)}
        </div>
      </section>

      <button
        type="button"
        onClick={() => goMobile("budget")}
        className="mt-[18px] w-full rounded-card bg-card p-5 text-left"
      >
        <div className="flex items-center justify-between text-[12.5px] font-bold text-muted">
          <span>Spent this month</span>
          <span className="text-ink">
            {formatMoney(summary.spentCents)}{" "}
            <span className="text-subtle">/ {formatMoney(summary.budgetCents)}</span>
          </span>
        </div>
        <ProgressBar percent={budgetPercent} color="#d97a54" height={9} className="mt-3" />
        <div className="mt-2.5 flex items-center justify-between">
          <span className="text-[11.5px] font-semibold text-muted">
            {formatMoney(leftCents)} left · {summary.daysLeft} days to go
          </span>
          <span className="text-[11.5px] font-extrabold text-primary">Edit budget ›</span>
        </div>
      </button>

      <SectionHeader
        title="Categories"
        action="See all ›"
        onAction={() => goMobile("categories")}
        className="mt-6"
      />
      <div className="mt-3.5 flex flex-col gap-3.5">
        {homeCategories.map((category) => (
          <CategoryBar
            key={category.id}
            category={category}
            onClick={() => openCategory(category.id)}
          />
        ))}
      </div>

      {transactionsLoading ? (
        <>
          <SectionHeader title="Frequent spots" className="mt-[22px]" />
          <div className="mt-3 rounded-card bg-card p-4">
            <SkeletonRows rows={3} />
          </div>
        </>
      ) : (
        topMerch.length > 0 && (
          <>
            <SectionHeader title="Frequent spots" className="mt-[22px]" />
            <div className="mt-3 rounded-card bg-card px-4">
              {topMerch.map((m, i) => (
                <div
                  key={m.name}
                  className={`flex items-center justify-between py-2.5 text-[13px] ${
                    i < topMerch.length - 1 ? "border-b border-[#f7efe3]" : ""
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">
                    {m.emoji} {m.name}
                    <span className="ml-1 font-semibold text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 font-extrabold tabular-nums text-primary">
                    {m.count}× visits
                  </span>
                </div>
              ))}
            </div>
          </>
        )
      )}

      <SectionHeader
        title="Recent transactions"
        action="See all ›"
        onAction={() => goMobile("history")}
        className="mt-[22px]"
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

      <SectionHeader title="Spending trend" className="mt-[22px]" />
      <div className="mt-3 rounded-card bg-card p-4">
        {transactionsLoading ? (
          <Skeleton className="h-[140px] w-full" />
        ) : (
          <BarChart points={trendPoints} height={140} tooltips={trendTooltips} />
        )}
      </div>
    </div>
  );
}
