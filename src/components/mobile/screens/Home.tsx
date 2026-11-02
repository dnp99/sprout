"use client";

import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { useActivationItems } from "@/components/shared/useActivationItems";
import { PersonalCalendar } from "@/components/shared/PersonalCalendar";

import { EntitySymbol } from "@/components/ui/EntitySymbol";

import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { ActivationChecklist } from "@/components/shared/ActivationChecklist";
import { BudgetRingHero } from "@/components/shared/BudgetRingHero";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { SectionHeader } from "@/components/ui/headers";
import { buildBudgetHero } from "@/lib/budget-hero";
import { formatMoney } from "@/lib/format";
import { filterTransactions } from "@/lib/search";
import { topRecurringMerchants } from "@/lib/trends";
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
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;

  const hasBudget = summary.budgetCents > 0;
  const fmt = useFormatters();
  const t = useTranslations();
  const hero = useMemo(
    () => buildBudgetHero(summary, recurring, new Date(), fmt.locale),
    [summary, recurring, fmt.locale],
  );

  const activationItems = useActivationItems(true);

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
