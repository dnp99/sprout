"use client";

import { useMemo } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BarChart } from "@/components/ui/BarChart";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { formatMoney, spentPercent } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { monthlyTrend, topRecurringMerchants, toTrendPoints } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Home() {
  const {
    user,
    categories,
    transactions,
    transactionsLoading,
    summary,
    set,
    goMobile,
    openTransaction,
  } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
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
  // Friendly full-date subtitle, e.g. "Wednesday, Jul 8".
  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
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
          <h1 className="text-[26px] font-extrabold leading-none text-ink">
            Hey {user.greetingName}
          </h1>
          <p className="mt-1.5 text-[13px] font-bold text-muted">{todayLabel}</p>
        </div>
        <button type="button" aria-label="Account & settings" onClick={() => goMobile("settings")}>
          <Avatar size={56} initial={user.greetingName.slice(0, 1)} />
        </button>
      </header>

      {/* Hero: safe-to-spend headline, a two-tone spent/remaining bar, and the
          month's key totals. Tapping anywhere opens the budget editor. */}
      <button
        type="button"
        onClick={() => goMobile("budget")}
        className="mt-5 w-full rounded-card bg-card p-6 text-left"
      >
        <div className="text-[11.5px] font-extrabold uppercase tracking-wide text-muted">
          Safe to spend
        </div>
        <div className="mt-1.5 flex items-start gap-2">
          <span className="text-[42px] font-extrabold leading-none tracking-tight text-ink tabular-nums">
            {formatMoney(summary.safeToSpendCents)}
          </span>
          <span className="mt-1 w-[62px] flex-none text-[13px] font-bold leading-tight text-muted">
            · {summary.daysLeft} days left
          </span>
        </div>

        {/* Two-tone bar: terracotta = spent, green = still safe to spend. */}
        <div className="mt-5 flex h-4 items-stretch gap-1">
          <div
            className="rounded-full bg-primary"
            style={{ width: `${Math.max(budgetPercent, 4)}%` }}
          />
          <div className="flex-1 rounded-full bg-green" />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <HeroStat dotClass="bg-primary" label="Spent" value={formatMoney(summary.spentCents)} />
          <HeroStat
            dotClass="bg-green"
            label="Safe"
            value={formatMoney(summary.safeToSpendCents)}
          />
          <HeroStat label="Income" value={formatMoney(summary.incomeCents)} />
        </div>
      </button>

      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() =>
            set({ searchType: "uncategorized", txnCategory: "all", mobileScreen: "history" })
          }
          className="mt-3.5 flex w-full items-center gap-3 rounded-2xl bg-card/60 px-4 py-3 text-left"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="flex-none text-subtle"
            aria-hidden
          >
            <path d="M9 6h11M9 12h11M9 18h11" />
            <circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none" />
          </svg>
          <span className="flex-1 text-[13.5px] font-bold leading-snug text-muted">
            {uncategorizedCount} transactions to tidy up when you have a minute
          </span>
          <span className="flex-none text-[13px] font-extrabold text-primary">Review ›</span>
        </button>
      )}

      {transactionsLoading ? (
        <>
          <SectionHeader title="Frequent spots" className="mt-6" />
          <div className="mt-3 rounded-card bg-card p-4">
            <SkeletonRows rows={3} />
          </div>
        </>
      ) : (
        topMerch.length > 0 && (
          <>
            <SectionHeader title="Frequent spots" className="mt-6" />
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
        title="Categories"
        action="See all ›"
        onAction={() => goMobile("categories")}
        className="mt-[22px]"
      />
      <div className="mt-3.5 flex flex-col gap-3.5">
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
        action="See all ›"
        onAction={() => set({ searchType: "all", txnCategory: "all", mobileScreen: "history" })}
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

/** One labelled total in the hero card, with an optional legend dot matching
 *  the two-tone spend bar. */
function HeroStat({ label, value, dotClass }: { label: string; value: string; dotClass?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {dotClass && <span className={`h-2 w-2 flex-none rounded-full ${dotClass}`} />}
        <span className="truncate text-[11.5px] font-bold text-muted">{label}</span>
      </div>
      <div className="mt-1 text-[16px] font-extrabold tabular-nums text-ink">{value}</div>
    </div>
  );
}
