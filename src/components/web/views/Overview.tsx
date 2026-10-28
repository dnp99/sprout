"use client";

import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { useActivationItems } from "@/components/shared/useActivationItems";
import { PersonalCalendar } from "@/components/shared/PersonalCalendar";

import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { ActivationChecklist } from "@/components/shared/ActivationChecklist";
import { BudgetRingHero } from "@/components/shared/BudgetRingHero";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { buildBudgetHero } from "@/lib/budget-hero";
import { filterTransactions } from "@/lib/search";
import { topRecurringMerchants } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useFormatters } from "@/i18n/useFormatters";
import { useTranslations } from "next-intl";

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
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const fmt = useFormatters();
  const t = useTranslations();
  const hero = useMemo(
    () => buildBudgetHero(summary, recurring, new Date(), fmt.locale),
    [summary, recurring, fmt.locale],
  );

  const activationItems = useActivationItems();

  // Frequent-habit merchants over the rolling last 30 days — not month-scoped.
  const topMerch = useMemo(() => topRecurringMerchants(transactions, 2), [transactions]);

  return (
    <div className="home-composition mt-4 flex min-h-0 flex-1 flex-col gap-3.5">
      {!transactionsLoading && uncategorizedCount > 0 && (
        <button
          type="button"
          onClick={() => set({ webView: "transactions", webTxnType: "uncategorized" })}
          className="flex items-center justify-between rounded-[12px] border border-soft-border bg-primary-soft px-[15px] py-[11px] text-left"
        >
          <span className="flex items-center gap-2.5 text-[13px] font-semibold text-primary">
            <AlertCircle size={16} strokeWidth={2} />
            {t("overview.needCategory", { count: uncategorizedCount })}
          </span>
          <span className="text-[12.5px] font-semibold text-primary">{t("overview.review")}</span>
        </button>
      )}

      {/* Row 1 — budget-ring hero (dominant color, left) + Get started checklist
          (right). Shared with the mobile hero via buildBudgetHero. */}
      <div className="context-color-pair cozy-hero-row grid grid-cols-2 items-stretch gap-3.5 [&>*:only-child]:col-span-2">
        <BudgetRingHero
          model={hero}
          className="context-major cozy-budget-card"
          onEdit={() => set({ webEditBudgetOpen: true })}
          onSetBudget={() => set({ webEditBudgetOpen: true })}
        />
        {!transactionsLoading && (
          <ActivationChecklist
            className="context-minor-alt cozy-checklist-card"
            key={summary.budgetCents > 0 && transactions.length > 0 ? "complete" : "active"}
            items={activationItems}
            subtitle={t("checklist.subtitleWeb")}
          />
        )}
      </div>

      {/* Recent transactions live in the calendar agenda; keep only the
          distinct merchant-habit summary here, without a vacant grid column. */}
      <div className="grid gap-3.5">
        <div className="context-minor cozy-merchants-card rounded-[14px] border border-edge p-[15px_16px]">
          <div className="text-[13.5px] font-bold">{t("overview.frequentSpots")}</div>
          <div className="mt-px text-[10.5px] text-muted">{t("overview.last30")}</div>
          {transactionsLoading ? (
            <SkeletonRows rows={2} className="mt-3" />
          ) : topMerch.length === 0 ? (
            <div className="flex min-h-[64px] items-center justify-center">
              <EmptyHint title={t("overview.emptyFrequent")} />
            </div>
          ) : (
            topMerch.map((m) => (
              <div key={m.name} className="mt-2 flex items-center justify-between first:mt-3">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                  {m.name} <span className="font-normal text-muted">· {fmt.money(m.cents)}</span>
                </span>
                <span className="ml-2 text-[11.5px] font-semibold text-primary">{m.count}×</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="home-calendar">
        <PersonalCalendar />
      </div>
      <OverviewSpendingInsights />
    </div>
  );
}
