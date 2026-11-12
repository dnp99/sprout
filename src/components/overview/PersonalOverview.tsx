"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";
import { buildBudgetHero } from "@/lib/budget-hero";
import { topRecurringMerchants } from "@/lib/trends";
import { groupToday } from "@/lib/groups/navigation";
import { filterTransactions } from "@/lib/search";
import { PersonalCalendar } from "@/components/shared/PersonalCalendar";
import { BudgetHeroMessage } from "@/components/shared/BudgetRingHero";
import { ActivationChecklist } from "@/components/shared/ActivationChecklist";
import { useActivationItems } from "@/components/shared/useActivationItems";
import { OverviewDashboard } from "./OverviewDashboard";
import { BudgetOverview } from "./BudgetOverview";
import { FrequentSpots } from "./FrequentSpots";
import { SpendingPreview } from "./SpendingPreview";

/** Both responsive Personal shells consume the same current-month API summary.
 * Calendar navigation remains independent; Trends retains its own period state. */
export function PersonalOverview({ mobile = false }: { mobile?: boolean }) {
  const s = useStore(
    useShallow((s) => ({
      summary: s.summary,
      transactions: s.transactions,
      loading: s.transactionsLoading,
      categories: s.categories,
      recurring: s.recurring,
      set: s.set,
      goMobile: s.goMobile,
    })),
  );
  const t = useTranslations("dashboard"),
    h = useTranslations("hero"),
    o = useTranslations("overview"),
    fmt = useFormatters();
  const activation = useActivationItems(mobile);
  const month = groupToday().slice(0, 7);
  const hero = useMemo(
    () => buildBudgetHero(s.summary, s.recurring, new Date(), fmt.locale),
    [s.summary, s.recurring, fmt.locale],
  );
  const merchants = useMemo(() => topRecurringMerchants(s.transactions, 3), [s.transactions]);
  const uncategorized = filterTransactions(s.transactions, { type: "uncategorized" }).length;
  const budget = () => (mobile ? s.goMobile("budget") : s.set({ webEditBudgetOpen: true }));
  const transactions = () => (mobile ? s.goMobile("history") : s.set({ webView: "transactions" }));
  const explore = () => (mobile ? s.goMobile("trends") : s.set({ webView: "trends" }));
  return (
    <OverviewDashboard
      period={fmt.monthKey(month)}
      loading={s.loading}
      metrics={[
        { label: t("spending"), cents: s.summary.spentCents },
        { label: t("income"), cents: s.summary.incomeCents, tone: "positive" },
        {
          label: t("net"),
          cents: s.summary.savedCents,
          tone: s.summary.savedCents < 0 ? "negative" : "positive",
        },
        { label: h("yoursToSpend"), cents: hero.hasBudget ? s.summary.safeToSpendCents : null },
      ]}
      calendar={<PersonalCalendar compact={mobile} dashboard />}
      budget={
        <BudgetOverview
          title={t("budgetOverview")}
          label={h(hero.headlineLabelKey)}
          value={hero.headlineValue}
          budget={s.summary.budgetCents}
          spent={s.summary.spentCents}
          configured={hero.hasBudget}
          loading={s.loading}
          action={
            <button
              type="button"
              onClick={budget}
              className={`dashboard-link ${!hero.hasBudget ? "dashboard-primary bg-primary text-onprimary" : ""}`}
            >
              {hero.hasBudget ? t("editBudget") : t("setBudget")}
            </button>
          }
        >
          {hero.hasBudget && (
            <div className="mt-3 space-y-2 text-body text-muted">
              <p>
                <BudgetHeroMessage t={h} m={hero.sub} />
              </p>
              <p>
                <BudgetHeroMessage t={h} m={hero.coach.sentence} />
              </p>
              <p className="text-meta">{h("daysLeft", { days: hero.daysLeft })}</p>
              {hero.payday && (
                <div className="rounded-[8px] bg-track p-2 text-body">
                  <BudgetHeroMessage t={h} m={hero.payday.title} /> · {hero.payday.amountLabel}
                  <p className="mt-1 text-meta">
                    <BudgetHeroMessage t={h} m={hero.payday.subtitle} />
                  </p>
                </div>
              )}
            </div>
          )}
        </BudgetOverview>
      }
      merchants={<FrequentSpots rows={merchants} loading={s.loading} onOpen={transactions} />}
      insights={
        <SpendingPreview
          transactions={s.transactions}
          categories={s.categories}
          month={month}
          loading={s.loading}
          onExplore={explore}
        />
      }
      actions={
        <>
          {!s.loading && uncategorized > 0 && (
            <button
              type="button"
              className="dashboard-link"
              onClick={() => {
                s.set(
                  mobile
                    ? { searchType: "uncategorized", txnCategory: "all" }
                    : { webTxnType: "all", webTxnQuickType: "uncategorized" },
                );
                transactions();
              }}
            >
              {o("needCategory", { count: uncategorized })} · {o("review")}
            </button>
          )}
          <button type="button" onClick={transactions} className="dashboard-link">
            {t("viewTransactions")}
          </button>
          {!s.loading && <ActivationChecklist items={activation} subtitle={t("setupHint")} />}
        </>
      }
    />
  );
}
