"use client";

import {
  AlertCircle,
  ChevronRight,
  Mic,
  NotebookText,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { ActivationChecklist, type ActivationItem } from "@/components/shared/ActivationChecklist";
import { DiscoveryCard } from "@/components/shared/DiscoveryCard";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { BarChart } from "@/components/ui/BarChart";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { monthlyBillsTotalCents } from "@/lib/bills";
import { formatMoney, spentPercent } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { buildSpendingTrend, monthlyTrend, topRecurringMerchants } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Home() {
  const {
    categories,
    recurring,
    transactions,
    transactionsLoading,
    summary,
    goals,
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
      goals: s.goals,
      set: s.set,
      goMobile: s.goMobile,
      openTransaction: s.openTransaction,
    })),
  );
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const budgetPercent = spentPercent(summary.spentCents, summary.budgetCents);
  const hasBudget = summary.budgetCents > 0;
  // safeToSpendCents is floored at 0, so detect over-budget from the raw figures.
  const overBudget = summary.spentCents > summary.budgetCents;

  // First-run activation steps, derived from real data. Budget + first
  // transaction are the core (their completion hides the card); a goal is a
  // nudge. See plans/007.
  const activationItems: ActivationItem[] = [
    {
      key: "budget",
      label: "Set your monthly budget",
      done: hasBudget,
      required: true,
      onClick: () => goMobile("budget"),
    },
    {
      key: "txn",
      label: "Add your first transaction",
      done: transactions.length > 0,
      required: true,
      onClick: () => goMobile("add"),
    },
    {
      key: "goal",
      label: "Pick a savings goal",
      done: goals.length > 0,
      onClick: () => goMobile("goals"),
    },
  ];
  const dueThisMonthCents = monthlyBillsTotalCents(recurring);
  // Feature the top spenders this month (real data — no fixed category ids).
  const homeCategories = [...categories].sort((a, b) => b.spentCents - a.spentCents).slice(0, 4);
  const recent = transactions.slice(0, 3);

  // Frequent-habit merchants over the rolling last 30 days.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 5), [transactions]);

  // Spending trend (bottom of the page), mirroring the web Overview: 6 months,
  // a budget reference line, and an honest paced estimate for the current month.
  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const trend = useMemo(
    () => buildSpendingTrend(months, { budgetCents: summary.budgetCents }),
    [months, summary.budgetCents],
  );

  return (
    <div className="px-4 pt-3">
      {/* First-run activation checklist — self-hides once budget + a first
          transaction exist (see ActivationChecklist / plans/007). Renders null
          when complete, so the stat grid's own top margin handles spacing.
          Gated on !transactionsLoading so it doesn't flash during the two-phase
          load (transactions arrive after the summary). */}
      {!transactionsLoading && <ActivationChecklist items={activationItems} />}

      {/* Feature discovery — dismissible. */}
      {!transactionsLoading && (
        <div className="mt-3 flex flex-col gap-2">
          <DiscoveryCard
            id="capture"
            icon={<Mic size={15} strokeWidth={2} />}
            title="Log by voice or text"
            body="Set up a Siri Shortcut or WhatsApp — no app needed."
            onOpen={() => goMobile("connectedApps")}
          />
          <DiscoveryCard
            id="import"
            icon={<Sparkles size={15} strokeWidth={2} />}
            title="Import your bank statement"
            body="Smart Import maps any CSV automatically."
            onOpen={() => goMobile("import")}
          />
        </div>
      )}

      {/* The top block should read as one composed overview, not four equally
          loud cards. The hero owns the month context; the KPI strip below holds
          the secondary metrics. */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => goMobile("budget")}
          className="relative w-full overflow-hidden rounded-[18px] bg-primary px-4 pb-4 pt-3.5 text-left"
        >
          <div className="pointer-events-none absolute right-[-28px] top-[-18px] h-24 w-24 rounded-full bg-onprimary/10" />
          {hasBudget ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-onprimary/75">
                    {summary.monthLabel}
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase tracking-[.05em] text-onprimary/85">
                    Safe to spend
                  </div>
                </div>
                <div className="rounded-full bg-onprimary/14 px-2.5 py-1 text-[11px] font-semibold text-onprimary/90">
                  {summary.daysLeft} days left
                </div>
              </div>
              <div className="mt-3 text-[31px] font-bold tabular-nums leading-none tracking-[-0.03em] text-onprimary">
                {formatMoney(summary.safeToSpendCents)}
              </div>

              <div className="mt-4 rounded-[14px] bg-onprimary/10 p-3">
                <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-onprimary/80">
                  <span>Spent {formatMoney(summary.spentCents)}</span>
                  <span>Budget {formatMoney(summary.budgetCents)}</span>
                </div>
                {/* Two-tone bar: darker = spent, lighter track = still safe. */}
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-onprimary/20">
                  <div
                    className="h-full rounded-full bg-onprimary"
                    style={{ width: `${Math.max(budgetPercent, 4)}%` }}
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2 text-[11px] font-semibold text-onprimary/78">
                  <span>{overBudget ? "Over budget this month" : "Still available"}</span>
                  <span>Tap to edit</span>
                </div>
              </div>
            </>
          ) : (
            // No budget set yet — prompt the user to set one instead of "$0".
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-onprimary/75">
                  This month
                </div>
                <div className="mt-1 text-[11px] font-semibold uppercase tracking-[.05em] text-onprimary/85">
                  Set your budget
                </div>
                <div className="mt-2 text-[22px] font-bold leading-tight text-onprimary">
                  Give every dollar a job
                </div>
                <div className="mt-2 text-[12px] font-medium leading-relaxed text-onprimary/80">
                  Set your monthly pool so safe-to-spend and category progress become useful.
                </div>
              </div>
              <ChevronRight size={22} strokeWidth={2.5} className="flex-none text-onprimary" />
            </div>
          )}
        </button>

        <div className="mt-2.5 rounded-[14px] border border-edge bg-card p-1.5">
          <div className="grid grid-cols-3">
            <QuickStat label="Spent" value={formatMoney(summary.spentCents)} />
            <QuickStat
              label="Saved"
              value={formatMoney(summary.savedCents)}
              valueClassName={summary.savedCents < 0 ? "text-primary" : "text-green"}
              className="border-x border-edge"
            />
            <QuickStat
              label="Income"
              value={formatMoney(summary.incomeCents)}
              valueClassName="text-green"
            />
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[14px] border border-edge bg-card p-3.5">
        <button
          type="button"
          onClick={() => goMobile("bills")}
          className="flex w-full items-center gap-3 rounded-[12px] px-1 py-0.5 text-left"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-primary">
            <NotebookText size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-ink">Bills</div>
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
      </div>

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
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {topMerch.map((m, i) => (
                <button
                  key={m.name}
                  type="button"
                  onClick={() =>
                    set({ searchType: "all", txnCategory: "all", mobileScreen: "history" })
                  }
                  className={`shrink-0 rounded-[14px] border border-edge bg-card px-3.5 py-3 text-left ${
                    i === 0 ? "min-w-[168px]" : "min-w-[152px]"
                  }`}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-[.05em] text-muted">
                    Frequent spot
                  </div>
                  <div className="mt-2 truncate text-[13px] font-semibold text-ink">
                    {m.emoji} {m.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-muted">
                      {formatMoney(m.cents)}
                    </span>
                    <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">
                      {m.count} visits
                    </span>
                  </div>
                </button>
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
      <OverviewPanel className="mt-3 p-4">
        {!transactionsLoading && transactions.length === 0 ? (
          <EmptyHint title="Add a transaction to see where your money goes." />
        ) : (
          <div className="flex flex-col gap-4">
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
        )}
      </OverviewPanel>

      <SectionHeader
        title="Recent transactions"
        action="View all ›"
        onAction={() => set({ searchType: "all", txnCategory: "all", mobileScreen: "history" })}
        className="mt-6"
      />
      <OverviewPanel className="mt-3 p-3.5">
        {transactionsLoading ? (
          <SkeletonRows rows={5} className="gap-3" />
        ) : recent.length === 0 ? (
          <EmptyHint title="No transactions yet — add your first, or import a statement.">
            <div className="flex gap-2">
              <StarterButton primary onClick={() => goMobile("add")}>
                Add transaction
              </StarterButton>
              <StarterButton onClick={() => goMobile("import")}>Import</StarterButton>
            </div>
          </EmptyHint>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recent.map((txn) => (
              <TransactionCard key={txn.id} txn={txn} onClick={() => openTransaction(txn.id)} />
            ))}
          </div>
        )}
      </OverviewPanel>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-bold text-ink">Spending trend</h2>
          <TrendingDown size={15} strokeWidth={2} className="text-green" />
        </div>
        {trend.changePct !== null && (
          <div
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
              trend.changePct <= 0 ? "bg-track text-green" : "bg-primary-soft text-primary"
            }`}
          >
            {trend.changePct <= 0 ? (
              <TrendingDown size={12} strokeWidth={2.2} />
            ) : (
              <TrendingUp size={12} strokeWidth={2.2} />
            )}
            {Math.abs(trend.changePct)}%{trend.projectedCents !== null ? " proj." : ""} vs{" "}
            {trend.previousLabel}
          </div>
        )}
      </div>
      {/* While the month is in progress, show what it's pacing toward. */}
      {trend.projectedCents !== null && !transactionsLoading && transactions.length > 0 && (
        <div className="mt-1 text-[11.5px] font-medium text-muted">
          On pace for {formatMoney(trend.projectedCents)} this month
        </div>
      )}
      <OverviewPanel className="mt-3 p-4">
        {transactionsLoading ? (
          <Skeleton className="h-[140px] w-full" />
        ) : transactions.length === 0 ? (
          <EmptyHint title="Your spending trend will appear here once you add transactions." />
        ) : (
          <BarChart
            points={trend.points}
            height={140}
            tooltips={trend.tooltips}
            budgetPercent={trend.budgetPercent}
          />
        )}
      </OverviewPanel>
    </div>
  );
}

/** Small pill button used in the Recent-transactions empty state. */
function StarterButton({
  primary,
  onClick,
  children,
}: {
  primary?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-[12.5px] font-semibold transition ${
        primary ? "bg-primary text-onprimary" : "border border-edge text-ink hover:bg-track/60"
      }`}
    >
      {children}
    </button>
  );
}

/** Shared outlined section surface for the mobile overview. */
function OverviewPanel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-[14px] border border-edge bg-card ${className ?? ""}`}>{children}</div>
  );
}

/** Compact KPI inside the 3-column summary strip. */
function QuickStat({
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
    <div className={`px-3 py-3.5 ${className ?? ""}`}>
      <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">{label}</div>
      <div
        className={`mt-1 text-[18px] font-bold tabular-nums tracking-[-0.02em] text-ink ${valueClassName ?? ""}`}
      >
        {value}
      </div>
    </div>
  );
}
