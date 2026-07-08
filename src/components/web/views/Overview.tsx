"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/ui/BarChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { TxnTags } from "@/components/ui/TxnTags";
import { CategoryBar } from "@/components/ui/rows";
import { deriveUpcomingBills } from "@/lib/bills";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import {
  monthlyTrend,
  spendChangePercent,
  topRecurringMerchants,
  toTrendPoints,
} from "@/lib/trends";
import { useStore } from "@/state/store";

export function Overview() {
  const { summary, goals, recurring, transactions, transactionsLoading, categories, set } =
    useStore();
  const recent = transactions.slice(0, 4);
  const upcomingBills = deriveUpcomingBills(recurring);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  // The dashboard focuses on the current month (matching the header + summary
  // cards). Everything below is computed from the loaded transactions.
  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const currentIndex = months.length - 1;
  const current = months[currentIndex];
  const previous = currentIndex > 0 ? months[currentIndex - 1] : undefined;

  // Overview shows a compact last-3-months trend; "See all" opens full Trends.
  const trendMonths = months.slice(-3);
  const trendPoints = toTrendPoints(trendMonths, current?.key ?? "");
  const trendTooltips = trendMonths.map((m) => `${m.label} · ${formatMoney(m.spentCents)}`);
  const changePct = previous
    ? spendChangePercent(current?.spentCents ?? 0, previous.spentCents)
    : null;

  // "By category" as a readable spend bar-list (summary-derived → instant).
  // Top 4 by spend — "See all" in the header opens the full Categories view.
  const topCategories = useMemo(
    () => [...categories].sort((a, b) => b.spentCents - a.spentCents).slice(0, 4),
    [categories],
  );

  // Frequent-habit merchants over the rolling last 30 days — not month-scoped.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 5), [transactions]);

  return (
    <div className="flex flex-col gap-4">
      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() => set({ webView: "transactions", webTxnType: "uncategorized" })}
          className="flex items-center justify-between rounded-[20px] bg-[#fbeee2] px-6 py-4 text-left"
        >
          <span className="text-[14px] font-extrabold text-primary-dark">
            🏷️ {uncategorizedCount} transaction{uncategorizedCount === 1 ? "" : "s"} need a category
          </span>
          <span className="text-[13px] font-extrabold text-primary">Review ›</span>
        </button>
      )}
      <div className="flex gap-4">
        <StatCard
          label="Safe to spend"
          value={formatMoney(summary.safeToSpendCents)}
          variant="primary"
          className="flex-1"
        />
        <StatCard label="Spent" value={formatMoney(summary.spentCents)} className="flex-1" />
        <StatCard
          label="Saved"
          value={formatMoney(summary.savedCents)}
          variant="income"
          className="flex-1"
        />
        <StatCard
          label="Income"
          value={formatMoney(summary.incomeCents)}
          valueClassName="text-[#4f7a3a]"
          className="flex-1"
        />
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-[1.4] rounded-[20px] bg-card p-6">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-ink">Recent transactions</span>
            <button
              type="button"
              onClick={() => set({ webView: "transactions" })}
              className="text-xs font-extrabold text-primary"
            >
              View all ›
            </button>
          </div>
          {transactionsLoading ? (
            <SkeletonRows rows={4} className="py-1" />
          ) : (
            recent.map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between border-b border-track py-2.5 text-[13px] last:border-0"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  {txn.emoji} {txn.merchant}
                  <TxnTags txn={txn} />
                </span>
                <span className="text-muted">
                  {txn.categoryName} · {txn.dateLabel}
                </span>
                <span
                  className={`font-extrabold tabular-nums ${txn.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
                >
                  {formatMoney(txn.amountCents, { signed: true })}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex-1 rounded-[20px] bg-card p-5">
          <div className="text-sm font-extrabold text-ink">Frequent spots</div>
          <div className="mb-3 mt-0.5 text-[11px] font-bold text-muted">
            Where you keep going · last 30 days
          </div>
          <div className="flex flex-col gap-2.5 text-[12.5px]">
            {transactionsLoading && <SkeletonRows rows={3} />}
            {!transactionsLoading && topMerch.length === 0 && (
              <div className="font-semibold text-muted">No repeat visits yet.</div>
            )}
            {!transactionsLoading &&
              topMerch.map((m) => (
                <div key={m.name} className="flex items-center justify-between">
                  <span className="min-w-0 flex-1 truncate font-bold">
                    {m.emoji} {m.name}
                    <span className="ml-1 font-semibold text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 font-extrabold tabular-nums text-primary">
                    {m.count}× visits
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <div className="rounded-[20px] bg-card p-5">
            <div className="mb-3 text-sm font-extrabold text-ink">Upcoming bills</div>
            <div className="flex flex-col gap-2.5 text-[12.5px]">
              {upcomingBills.length === 0 && (
                <div className="font-semibold text-muted">Nothing due soon.</div>
              )}
              {upcomingBills.map((bill) => (
                <div key={bill.id} className="flex justify-between">
                  <span className="font-bold">
                    {bill.emoji} {bill.name}
                  </span>
                  <span className={`font-bold ${bill.urgent ? "text-primary-dark" : "text-muted"}`}>
                    {bill.dueLabel.replace("in ", "in ").replace(" days", "d")} ·{" "}
                    {formatMoney(bill.amountCents, { forceCents: true })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[20px] bg-card p-5">
            <div className="mb-3.5 text-sm font-extrabold text-ink">Goals</div>
            {goals.slice(0, 2).map((goal) => {
              const pct = Math.round((goal.savedCents / goal.targetCents) * 100);
              return (
                <div key={goal.id} className="mb-3.5 last:mb-0">
                  <div className="flex justify-between text-[12.5px] font-extrabold">
                    <span>
                      {goal.emoji} {goal.name}
                    </span>
                    <span className="text-muted">{pct}%</span>
                  </div>
                  <ProgressBar percent={pct} color={goal.color} height={7} className="mt-1.5" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-[1.6] rounded-[20px] bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-extrabold text-ink">Spending trend</span>
            <div className="flex items-center gap-3">
              {changePct !== null && (
                <span
                  className="text-xs font-extrabold"
                  style={{ color: changePct <= 0 ? "#4f7a3a" : "#c25b3a" }}
                >
                  {changePct <= 0 ? "↓" : "↑"} {Math.abs(changePct)}% vs {previous?.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => set({ webView: "trends" })}
                className="text-xs font-extrabold text-primary"
              >
                See all ›
              </button>
            </div>
          </div>
          <div className="mt-5">
            {transactionsLoading ? (
              <Skeleton className="h-[150px] w-full" />
            ) : (
              <BarChart points={trendPoints} height={150} tooltips={trendTooltips} />
            )}
          </div>
        </div>
        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-ink">By category</span>
            <button
              type="button"
              onClick={() => set({ webView: "categories" })}
              className="text-xs font-extrabold text-primary"
            >
              See all ›
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {topCategories.map((category) => (
              <CategoryBar
                key={category.id}
                category={category}
                onClick={() => set({ webView: "categories" })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
