"use client";

import { useMemo } from "react";
import { AlertCircle, Mic, Sparkles } from "lucide-react";
import { ActivationChecklist, type ActivationItem } from "@/components/shared/ActivationChecklist";
import { DiscoveryCard } from "@/components/shared/DiscoveryCard";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { OverviewSpendingComparison } from "@/components/shared/OverviewSpendingComparison";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { formatMoney, spentPercent } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { topRecurringMerchants } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Overview() {
  const { summary, transactions, transactionsLoading, categories, goals, recurring, set } =
    useStore(
      useShallow((s) => ({
        summary: s.summary,
        transactions: s.transactions,
        transactionsLoading: s.transactionsLoading,
        categories: s.categories,
        goals: s.goals,
        recurring: s.recurring,
        set: s.set,
      })),
    );
  const recent = transactions.slice(0, 4);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);
  // safeToSpendCents floors at 0, so read over-budget from the raw figures.
  const overBudget = summary.spentCents > summary.budgetCents;
  const netCents = summary.savedCents;

  // First-run activation steps, derived from data — mirrors mobile Home, with
  // web nav targets (Settings for budget, add modal, Goals view). See plans/007.
  const activationItems: ActivationItem[] = [
    {
      key: "budget",
      label: "Set your monthly budget",
      done: summary.budgetCents > 0,
      required: true,
      onClick: () => set({ webEditBudgetOpen: true }),
    },
    {
      key: "txn",
      label: "Add your first transaction",
      done: transactions.length > 0,
      required: true,
      onClick: () => set({ webAddOpen: true }),
    },
    {
      key: "recurring",
      label: "Set up recurring bills or income",
      done: recurring.length > 0,
      onClick: () => set({ webView: "bills" }),
    },
    {
      key: "goal",
      label: "Pick a savings goal",
      done: goals.length > 0,
      onClick: () => set({ webView: "goals" }),
    },
  ];

  // "By category" as a budget-usage bar-list (summary-derived → instant). Top 4
  // by spend — "See all" opens the full Categories view.
  const topCategories = useMemo(
    () => [...categories].sort((a, b) => b.spentCents - a.spentCents).slice(0, 4),
    [categories],
  );

  // Frequent-habit merchants over the rolling last 30 days — not month-scoped.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 2), [transactions]);

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3.5">
      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() => set({ webView: "transactions", webTxnType: "uncategorized" })}
          className="flex items-center justify-between rounded-[12px] border border-soft-border bg-primary-soft px-[15px] py-[11px] text-left"
        >
          <span className="flex items-center gap-2.5 text-[13px] font-semibold text-primary">
            <AlertCircle size={16} strokeWidth={2} />
            {uncategorizedCount} transaction{uncategorizedCount === 1 ? "" : "s"} need a category
          </span>
          <span className="text-[12.5px] font-semibold text-primary">Review ›</span>
        </button>
      )}

      {/* Feature discovery uses the same column split as the lower dashboard so
          the banner edges align with the cards beneath. Keep this row first so
          the product's highest-leverage nudges stay above the rest of Overview. */}
      {!transactionsLoading && (
        <div className="grid grid-cols-2 gap-3.5 empty:hidden [&>*:only-child]:col-span-2">
          <DiscoveryCard
            id="capture"
            className="min-w-0"
            icon={<Mic size={15} strokeWidth={2} />}
            title="Log expenses by voice or text"
            body="Set up a Siri Shortcut or WhatsApp - no app needed."
            onOpen={() => set({ webView: "settings" })}
          />
          <DiscoveryCard
            id="import"
            className="min-w-0"
            icon={<Sparkles size={15} strokeWidth={2} />}
            title="Import your bank statement"
            body="Smart Import helps you map almost any CSV in a couple of clicks."
            onOpen={() => set({ webView: "import" })}
          />
        </div>
      )}

      {/* Row 1 — budget-status summary (half width, left) + Get started
          checklist (right). Keep the same information as mobile, but sized for
          desktop instead of using the older louder terracotta hero. */}
      <div className="grid grid-cols-2 items-start gap-3.5">
        {summary.budgetCents > 0 ? (
          <button
            type="button"
            onClick={() => set({ webEditBudgetOpen: true })}
            className="relative w-full overflow-hidden rounded-[16px] border border-edge bg-card p-[18px_20px] text-left"
          >
            <div className="pointer-events-none absolute right-[-34px] top-[-28px] h-32 w-32 rounded-full bg-primary-soft/80" />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.06em] text-primary">
                  {summary.monthLabel}
                </div>
                <div className="mt-3 text-[11px] font-semibold uppercase tracking-[.06em] text-muted">
                  Left this month
                </div>
                <div
                  className={`mt-2 text-[34px] font-bold leading-none tracking-[-0.03em] tabular-nums ${
                    overBudget ? "text-primary-dark" : "text-ink"
                  }`}
                >
                  {formatMoney(summary.safeToSpendCents)}
                </div>
                <div className="mt-1 text-[12px] font-medium text-muted">
                  {overBudget
                    ? "You have spent past your monthly pool."
                    : "Safe to spend before the month ends."}
                </div>
              </div>
              <div className="flex-none rounded-full bg-track px-3 py-1 text-[11.5px] font-semibold text-muted">
                {summary.daysLeft} days left
              </div>
            </div>

            <div className="mt-4 rounded-[13px] border border-edge bg-track/55 p-3.5">
              <div className="flex items-center justify-between gap-3 text-[12px] font-semibold text-muted">
                <span>Spent {formatMoney(summary.spentCents)}</span>
                <span>Budget {formatMoney(summary.budgetCents)}</span>
              </div>
              {/* Two-tone bar: filled = spent, track = still available. */}
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-track">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(budgetPercent, 4)}%` }}
                />
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2 text-[12px] font-semibold text-muted">
                <span>{overBudget ? "Over budget this month" : "On track this month"}</span>
                <span>Edit budget ›</span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
              <OverviewHeroMetric label="Spent" value={formatMoney(summary.spentCents)} />
              <OverviewHeroMetric
                label="Net"
                value={formatMoney(netCents, { signed: true })}
                valueClassName={netCents < 0 ? "text-primary-dark" : "text-green"}
              />
              <OverviewHeroMetric
                label="Income"
                value={formatMoney(summary.incomeCents)}
                valueClassName="text-green"
              />
            </div>
          </button>
        ) : (
          // No budget set yet — prompt to set one instead of showing "$0".
          <button
            type="button"
            onClick={() => set({ webEditBudgetOpen: true })}
            className="relative w-full overflow-hidden rounded-[16px] border border-edge bg-card p-[18px_20px] text-left"
          >
            <div className="pointer-events-none absolute right-[-34px] top-[-28px] h-32 w-32 rounded-full bg-primary-soft/80" />
            <div className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[.06em] text-primary">
              {summary.monthLabel}
            </div>
            <div className="mt-3 text-[11px] font-semibold uppercase tracking-[.06em] text-muted">
              Set your budget
            </div>
            <div className="mt-1.5 text-[20px] font-bold leading-tight text-ink">
              Give every dollar a job
            </div>
            <div className="mt-2 text-[12px] font-medium leading-relaxed text-muted">
              Set your monthly pool so safe-to-spend and category progress become useful.
            </div>
          </button>
        )}
        {!transactionsLoading && (
          <ActivationChecklist
            key={summary.budgetCents > 0 && transactions.length > 0 ? "complete" : "active"}
            items={activationItems}
            subtitle="A few setup steps make the dashboard much more useful."
          />
        )}
      </div>

      {/* Row 2 — recent transactions (left) + frequent spots (right). Each card
          handles its own loading + empty state inline. */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col rounded-[14px] border border-edge p-[15px_16px]">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold">Recent transactions</span>
            <button
              type="button"
              onClick={() => set({ webView: "transactions" })}
              className="text-[11.5px] font-semibold text-primary"
            >
              View all ›
            </button>
          </div>
          {transactionsLoading ? (
            <SkeletonRows rows={4} className="mt-3" />
          ) : recent.length === 0 ? (
            <EmptyHint title="No transactions yet — add your first, or import a statement.">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set({ webAddOpen: true })}
                  className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-onprimary"
                >
                  Add transaction
                </button>
                <button
                  type="button"
                  onClick={() => set({ webView: "import" })}
                  className="rounded-full border border-edge px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-track/60"
                >
                  Import
                </button>
              </div>
            </EmptyHint>
          ) : (
            <div className="mt-3">
              {recent.map((txn, i) => (
                <div key={txn.id}>
                  {i > 0 && <div className="my-[11px] h-px bg-edge" />}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[13px] font-semibold">{txn.merchant}</div>
                      <div className="text-[11px] text-muted">
                        {txn.categoryName} · {txn.dateLabel}
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${txn.isIncome ? "text-green" : ""}`}
                    >
                      {formatMoney(txn.amountCents, { signed: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-edge p-[15px_16px]">
          <div className="text-[13.5px] font-bold">Frequent spots</div>
          <div className="mt-px text-[10.5px] text-muted">Last 30 days</div>
          {transactionsLoading ? (
            <SkeletonRows rows={2} className="mt-3" />
          ) : topMerch.length === 0 ? (
            <div className="flex min-h-[156px] items-center justify-center">
              <EmptyHint title="Repeat merchants will show up here once your last 30 days has a pattern." />
            </div>
          ) : (
            topMerch.map((m) => (
              <div key={m.name} className="mt-2 flex items-center justify-between first:mt-3">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                  {m.name} <span className="font-normal text-muted">· {formatMoney(m.cents)}</span>
                </span>
                <span className="ml-2 text-[11.5px] font-semibold text-primary">{m.count}×</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Row 3 — by category (left) + spending comparison (right). */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold">By category</span>
            <button
              type="button"
              onClick={() => set({ webView: "categories" })}
              className="text-[12px] font-semibold text-primary"
            >
              See all ›
            </button>
          </div>
          <div className="mt-3.5 flex flex-col gap-[11px]">
            {transactions.length === 0 && (
              <EmptyHint title="Add a transaction to see where your money goes." />
            )}
            {transactions.length > 0 &&
              topCategories.map((category) => {
                const budget = category.monthlyBudgetCents;
                const pct = budget > 0 ? Math.min(100, (category.spentCents / budget) * 100) : 0;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      set({
                        webView: "transactions",
                        webTxnType: "all",
                        txnCategory: category.id,
                      })
                    }
                    className="text-left"
                  >
                    <div className="flex justify-between text-[12px] font-semibold">
                      <span>{category.name}</span>
                      <span className="tabular-nums">{formatMoney(category.spentCents)}</span>
                    </div>
                    <div className="mt-[5px] h-1.5 overflow-hidden rounded-full bg-track">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>

        <OverviewSpendingComparison transactions={transactions} />
      </div>
    </div>
  );
}

function OverviewHeroMetric({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-[12px] bg-track/65 px-3 py-3">
      <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">{label}</div>
      <div
        className={`mt-1 text-[18px] font-bold tabular-nums tracking-[-0.02em] text-ink ${valueClassName ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
