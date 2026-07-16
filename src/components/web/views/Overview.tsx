"use client";

import { useMemo } from "react";
import { AlertCircle, Mic, Sparkles } from "lucide-react";
import { ActivationChecklist, type ActivationItem } from "@/components/shared/ActivationChecklist";
import { BudgetRingHero } from "@/components/shared/BudgetRingHero";
import { DiscoveryCard } from "@/components/shared/DiscoveryCard";
import { EmptyHint } from "@/components/shared/EmptyHint";
import { OverviewSpendingComparison } from "@/components/shared/OverviewSpendingComparison";
import { Skeleton, SkeletonRows } from "@/components/ui/Skeleton";
import { buildBudgetHero } from "@/lib/budget-hero";
import { formatMoney } from "@/lib/format";
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
  const recent = transactions.slice(0, 4);
  const uncategorizedCount = filterTransactions(transactions, { type: "uncategorized" }).length;
  const fmt = useFormatters();
  const t = useTranslations();
  const hero = useMemo(
    () => buildBudgetHero(summary, recurring, new Date(), fmt.locale),
    [summary, recurring, fmt.locale],
  );

  // First-run activation steps, derived from data — mirrors mobile Home, with
  // web nav targets (Settings for budget, add modal, Goals view). See plans/007.
  const activationItems: ActivationItem[] = [
    {
      key: "budget",
      label: t("checklist.itemBudget"),
      done: summary.budgetCents > 0,
      required: true,
      onClick: () => set({ webEditBudgetOpen: true }),
    },
    {
      key: "txn",
      label: t("checklist.itemTxn"),
      done: transactions.length > 0,
      required: true,
      onClick: () => set({ webAddOpen: true }),
    },
    {
      key: "recurring",
      label: t("checklist.itemRecurring"),
      done: recurring.length > 0,
      onClick: () => set({ webView: "bills" }),
    },
    {
      key: "goal",
      label: t("checklist.itemGoal"),
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
            {t("overview.needCategory", { count: uncategorizedCount })}
          </span>
          <span className="text-[12.5px] font-semibold text-primary">{t("overview.review")}</span>
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
            title={t("discovery.captureTitleWeb")}
            body={t("discovery.captureBody")}
            onOpen={() => set({ webView: "settings" })}
          />
          <DiscoveryCard
            id="import"
            className="min-w-0"
            icon={<Sparkles size={15} strokeWidth={2} />}
            title={t("discovery.importTitle")}
            body={t("discovery.importBodyWeb")}
            onOpen={() => set({ webView: "import" })}
          />
        </div>
      )}

      {/* Row 1 — budget-ring hero (half width, left) + Get started checklist
          (right). Shared with the mobile hero via buildBudgetHero. */}
      <div className="grid grid-cols-2 items-start gap-3.5">
        <BudgetRingHero
          model={hero}
          onEdit={() => set({ webEditBudgetOpen: true })}
          onSetBudget={() => set({ webEditBudgetOpen: true })}
        />
        {!transactionsLoading && (
          <ActivationChecklist
            key={summary.budgetCents > 0 && transactions.length > 0 ? "complete" : "active"}
            items={activationItems}
            subtitle={t("checklist.subtitleWeb")}
          />
        )}
      </div>

      {/* Row 2 — recent transactions (left) + frequent spots (right). Each card
          handles its own loading + empty state inline. */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="flex flex-col rounded-[14px] border border-edge p-[15px_16px]">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold">{t("overview.recent")}</span>
            <button
              type="button"
              onClick={() => set({ webView: "transactions" })}
              className="text-[11.5px] font-semibold text-primary"
            >
              {t("overview.viewAll")}
            </button>
          </div>
          {transactionsLoading ? (
            <SkeletonRows rows={4} className="mt-3" />
          ) : recent.length === 0 ? (
            <EmptyHint title={t("overview.emptyRecent")}>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set({ webAddOpen: true })}
                  className="rounded-full bg-primary px-4 py-2 text-[12.5px] font-semibold text-onprimary"
                >
                  {t("nav.addTransaction")}
                </button>
                <button
                  type="button"
                  onClick={() => set({ webView: "import" })}
                  className="rounded-full border border-edge px-4 py-2 text-[12.5px] font-semibold text-ink transition hover:bg-track/60"
                >
                  {t("overview.import")}
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
                        {txn.categoryName} · {fmt.txnDate(txn.occurredAt)}
                      </div>
                    </div>
                    <span
                      className={`text-[13px] font-semibold tabular-nums ${txn.isIncome ? "text-green" : ""}`}
                    >
                      {fmt.money(txn.amountCents, { signed: true })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[14px] border border-edge p-[15px_16px]">
          <div className="text-[13.5px] font-bold">{t("overview.frequentSpots")}</div>
          <div className="mt-px text-[10.5px] text-muted">{t("overview.last30")}</div>
          {transactionsLoading ? (
            <SkeletonRows rows={2} className="mt-3" />
          ) : topMerch.length === 0 ? (
            <div className="flex min-h-[156px] items-center justify-center">
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

      {/* Row 3 — by category (left) + spending comparison (right). */}
      <div className="grid grid-cols-2 gap-3.5">
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="flex items-center justify-between">
            <span className="text-[14px] font-bold">{t("overview.byCategory")}</span>
            <button
              type="button"
              onClick={() => set({ webView: "categories" })}
              className="text-[12px] font-semibold text-primary"
            >
              {t("overview.seeAll")}
            </button>
          </div>
          <div className="mt-3.5 flex flex-col gap-[11px]">
            {transactions.length === 0 && <EmptyHint title={t("overview.emptyCategory")} />}
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
                      <span className="tabular-nums">{fmt.money(category.spentCents)}</span>
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
