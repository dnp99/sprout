"use client";

import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { useActivationItems } from "@/components/shared/useActivationItems";
import { PersonalCalendar } from "@/components/shared/PersonalCalendar";

import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { AlertCircle, ChevronRight, NotebookText } from "lucide-react";
import { useMemo } from "react";
import { ActivationChecklist } from "@/components/shared/ActivationChecklist";
import { BudgetRingHero } from "@/components/shared/BudgetRingHero";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { useRecurringNeedsReviewCount } from "@/components/shared/useRecurringNeedsReviewCount";
import { NeedsReviewBadge } from "@/components/ui/NeedsReviewBadge";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { monthlyBillsTotalCents } from "@/lib/bills";
import { buildBudgetHero } from "@/lib/budget-hero";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { currentMonthKey, topRecurringMerchants } from "@/lib/trends";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

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
  const fmt = useFormatters();
  const t = useTranslations();
  const hero = useMemo(
    () => buildBudgetHero(summary, recurring, new Date(), fmt.locale),
    [summary, recurring, fmt.locale],
  );

  const activationItems = useActivationItems(true);
  const dueThisMonthCents = monthlyBillsTotalCents(recurring);

  // Frequent-habit merchants over the rolling last 30 days.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 5), [transactions]);

  return (
    <div className="home-composition flex flex-col px-4 pt-1.5">
      {/* Completed setup remains available in Settings. */}
      {!transactionsLoading && (
        <ActivationChecklist
          key={hasBudget && transactions.length > 0 ? "complete" : "active"}
          items={activationItems}
          subtitle={t("checklist.subtitleMobile")}
        />
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
              {t("overview.bills")}
              <NeedsReviewBadge count={needsReviewCount} />
            </div>
            <div className="mt-0.5 text-[11px] font-medium text-muted">
              {recurring.length === 0
                ? t("overview.billsTrack")
                : t("overview.dueThisMonth", {
                    amount: fmt.money(dueThisMonthCents, { forceCents: true }),
                  })}
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
              {t("overview.needCategory", { count: uncategorizedCount })}
            </span>
            <span className="flex-none text-[12px] font-semibold text-primary">
              {t("overview.review")}
            </span>
          </button>
        )}
      </div>

      {transactionsLoading ? (
        <>
          <SectionHeader title={t("overview.frequentSpots")} className="mt-6" />
          <div className="mt-3 rounded-[14px] border border-edge bg-card p-4">
            <SkeletonRows rows={3} />
          </div>
        </>
      ) : (
        topMerch.length > 0 && (
          <>
            <SectionHeader title={t("overview.frequentSpots")} className="mt-6" />
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
                    {t("overview.frequentSpot")}
                  </div>
                  <div className="mt-2 truncate text-[13px] font-semibold text-ink">
                    <EntitySymbol emoji={m.emoji} /> {m.name}
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-muted">{fmt.money(m.cents)}</span>
                    <span className="rounded-full bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">
                      {t("overview.visits", { count: m.count })}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )
      )}

      <div className="home-calendar">
        <PersonalCalendar compact />
      </div>
      <OverviewSpendingInsights compact className="mt-6" />
    </div>
  );
}
