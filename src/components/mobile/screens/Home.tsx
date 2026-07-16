"use client";

import { AlertCircle, ChevronRight, Mic, NotebookText, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { ActivationChecklist, type ActivationItem } from "@/components/shared/ActivationChecklist";
import { BudgetRingHero } from "@/components/shared/BudgetRingHero";
import { DiscoveryCard } from "@/components/shared/DiscoveryCard";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { OverviewSpendingComparison } from "@/components/shared/OverviewSpendingComparison";
import { useRecurringNeedsReviewCount } from "@/components/shared/useRecurringNeedsReviewCount";
import { NeedsReviewBadge } from "@/components/ui/NeedsReviewBadge";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { CategoryBar, TransactionCard } from "@/components/ui/rows";
import { monthlyBillsTotalCents } from "@/lib/bills";
import { buildBudgetHero } from "@/lib/budget-hero";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { currentMonthKey, topRecurringMerchants } from "@/lib/trends";
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
  const needsReviewCount = useRecurringNeedsReviewCount();
  const openBills = () => set({ mobileScreen: "bills", viewMonthKey: currentMonthKey() });
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const hasBudget = summary.budgetCents > 0;
  const hero = useMemo(() => buildBudgetHero(summary, recurring), [summary, recurring]);

  // First-run activation steps, derived from real data. Budget + first
  // transaction are the core milestones; the card stays visible after them so
  // optional setup remains discoverable. See plans/007.
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
      key: "recurring",
      label: "Set up recurring bills or income",
      done: recurring.length > 0,
      onClick: openBills,
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

  return (
    <div className="px-4 pt-1.5">
      {/* First-run activation checklist — always visible once data has loaded so
          Home keeps a stable onboarding surface instead of collapsing the top
          of the page after the first couple of steps are done. */}
      {!transactionsLoading && (
        <ActivationChecklist
          key={hasBudget && transactions.length > 0 ? "complete" : "active"}
          items={activationItems}
          subtitle="Finish the basics so the dashboard can start helping."
        />
      )}

      {/* Feature discovery — dismissible. */}
      {!transactionsLoading && (
        <div className="mt-3 flex flex-col gap-2">
          <DiscoveryCard
            id="capture"
            icon={<Mic size={15} strokeWidth={2} />}
            title="Log by voice or text"
            body="Set up a Siri Shortcut or WhatsApp - no app needed."
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

      {/* Budget-ring hero — the month's "yours to spend" + a used-budget gauge,
          pace coaching, and payday awareness. Shared with web via buildBudgetHero. */}
      <div className="mt-4">
        <BudgetRingHero
          model={hero}
          onEdit={() => goMobile("budget")}
          onSetBudget={() => goMobile("budget")}
          dense
        />
      </div>

      <div className="mt-3 rounded-[14px] border border-edge bg-card p-3.5">
        <button
          type="button"
          onClick={openBills}
          className="flex w-full items-center gap-3 rounded-[12px] px-1 py-0.5 text-left"
        >
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-primary">
            <NotebookText size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              Bills
              <NeedsReviewBadge count={needsReviewCount} />
            </div>
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

      <OverviewSpendingComparison transactions={transactions} compact className="mt-6" />
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
