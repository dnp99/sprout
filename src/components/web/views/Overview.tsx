"use client";

import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { ActivationChecklist, type ActivationItem } from "@/components/shared/ActivationChecklist";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { monthlyTrend, spendChangePercent, topRecurringMerchants } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Overview() {
  const { summary, transactions, transactionsLoading, categories, goals, set } = useStore(
    useShallow((s) => ({
      summary: s.summary,
      transactions: s.transactions,
      transactionsLoading: s.transactionsLoading,
      categories: s.categories,
      goals: s.goals,
      set: s.set,
    })),
  );
  const recent = transactions.slice(0, 4);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // First-run activation steps, derived from data — mirrors mobile Home, with
  // web nav targets (Settings for budget, add modal, Goals view). See plans/007.
  const activationItems: ActivationItem[] = [
    {
      key: "budget",
      label: "Set your monthly budget",
      done: summary.budgetCents > 0,
      required: true,
      onClick: () => set({ webView: "settings" }),
    },
    {
      key: "txn",
      label: "Add your first transaction",
      done: transactions.length > 0,
      required: true,
      onClick: () => set({ webAddOpen: true }),
    },
    {
      key: "goal",
      label: "Pick a savings goal",
      done: goals.length > 0,
      onClick: () => set({ webView: "goals" }),
    },
  ];

  // The dashboard focuses on the current month (matching the header + summary
  // cards). Everything below is computed from the loaded transactions.
  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const currentIndex = months.length - 1;
  const current = months[currentIndex];
  const previous = currentIndex > 0 ? months[currentIndex - 1] : undefined;

  // Compact last-3-months trend; "See all" opens full Trends.
  const trendMonths = months.slice(-3);
  const maxSpent = Math.max(...trendMonths.map((m) => m.spentCents), 1);
  const changePct = previous
    ? spendChangePercent(current?.spentCents ?? 0, previous.spentCents)
    : null;

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

      {/* First-run activation checklist — self-hides once budget + a first
          transaction exist (see ActivationChecklist / plans/007). */}
      <ActivationChecklist items={activationItems} />

      <div className="grid grid-cols-4 gap-3.5">
        {summary.budgetCents > 0 ? (
          <Stat
            label="Safe to spend"
            value={formatMoney(summary.safeToSpendCents)}
            variant="primary"
          />
        ) : (
          // No budget set yet — prompt to set one (in Settings) instead of "$0".
          <button
            type="button"
            onClick={() => set({ webView: "settings" })}
            className="rounded-[14px] bg-primary p-[15px_16px] text-left"
          >
            <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-onprimary/80">
              Set your budget
            </div>
            <div className="mt-[5px] text-[17px] font-bold leading-tight text-onprimary">
              Give every dollar a job ›
            </div>
          </button>
        )}
        <Stat label="Spent" value={formatMoney(summary.spentCents)} />
        <Stat label="Saved" value={formatMoney(summary.savedCents)} variant="saved" />
        <Stat label="Income" value={formatMoney(summary.incomeCents)} variant="income" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[1.4fr_1fr] gap-3.5">
        {/* Left: recent transactions + mini spending trend */}
        <div className="flex flex-col rounded-[14px] border border-edge p-[16px_18px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold">Recent transactions</span>
            <button
              type="button"
              onClick={() => set({ webView: "transactions" })}
              className="text-[12px] font-semibold text-primary"
            >
              View all ›
            </button>
          </div>
          {transactionsLoading ? (
            <SkeletonRows rows={4} className="mt-3.5" />
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
            <div className="mt-3.5">
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

          <div className="mt-auto" />
          <div className="my-[12px] mt-4 text-[13px] font-bold">
            Spending trend
            {changePct !== null && (
              <span
                className={`ml-1.5 text-[11px] font-semibold ${changePct <= 0 ? "text-green" : "text-primary"}`}
              >
                {changePct <= 0 ? "↓" : "↑"} {Math.abs(changePct)}% vs {previous?.label}
              </span>
            )}
          </div>
          {transactionsLoading ? (
            <Skeleton className="h-[60px] w-full" />
          ) : transactions.length === 0 ? (
            <EmptyHint title="Your spending trend will appear here once you add transactions." />
          ) : (
            <>
              <div className="flex h-[60px] items-end gap-3.5">
                {trendMonths.map((m, i) => (
                  <div
                    key={m.key}
                    className="flex h-full flex-1 flex-col justify-end"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar((h) => (h === i ? null : h))}
                  >
                    <div
                      className={`relative rounded-[6px] bg-primary ${m.key === current?.key ? "" : "opacity-[.26]"}`}
                      style={{
                        height: `${Math.max(4, Math.round((m.spentCents / maxSpent) * 100))}%`,
                      }}
                    >
                      {hoveredBar === i && (
                        <ChartTooltip label={`${m.label} · ${formatMoney(m.spentCents)}`} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-[7px] flex gap-3.5">
                {trendMonths.map((m) => (
                  <span
                    key={m.key}
                    className={`flex-1 text-center text-[10px] font-semibold ${m.key === current?.key ? "text-primary" : "text-muted"}`}
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: frequent spots + by category */}
        <div className="flex min-h-0 flex-col gap-3.5">
          <div className="rounded-[14px] border border-edge p-[15px_16px]">
            <div className="text-[13.5px] font-bold">Frequent spots</div>
            <div className="mt-px text-[10.5px] text-muted">Last 30 days</div>
            {transactionsLoading ? (
              <SkeletonRows rows={2} className="mt-3" />
            ) : topMerch.length === 0 ? (
              <div className="mt-3 text-[12.5px] text-muted">No repeat visits yet.</div>
            ) : (
              topMerch.map((m) => (
                <div key={m.name} className="mt-2 flex items-center justify-between first:mt-3">
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                    {m.name}{" "}
                    <span className="font-normal text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 text-[11.5px] font-semibold text-primary">{m.count}×</span>
                </div>
              ))
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col rounded-[14px] border border-edge p-[15px_16px]">
            <div className="flex items-center justify-between">
              <span className="text-[13.5px] font-bold">By category</span>
              <button
                type="button"
                onClick={() => set({ webView: "categories" })}
                className="text-[11.5px] font-semibold text-primary"
              >
                See all ›
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-[11px]">
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
        </div>
      </div>
    </div>
  );
}

/** Overview summary tile. `primary` fills terracotta; `saved` tints green;
 *  `income` colors the value green — matching the design's four stat cards. */
function Stat({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "primary" | "saved" | "income";
}) {
  const primary = variant === "primary";
  return (
    <div
      className={`rounded-[14px] p-[15px_16px] ${
        primary ? "bg-primary" : "border border-edge"
      } ${variant === "saved" ? "bg-green/[.12]" : ""}`}
    >
      <div
        className={`text-[10.5px] font-bold uppercase tracking-[.05em] ${primary ? "text-onprimary/80" : "text-muted"}`}
      >
        {label}
      </div>
      <div
        className={`mt-[5px] text-[26px] font-bold tracking-[-0.02em] tabular-nums ${
          primary ? "text-onprimary" : variant === "income" ? "text-green" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}
