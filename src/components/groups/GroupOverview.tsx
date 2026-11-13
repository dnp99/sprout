"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { groupTrendSource } from "@/lib/groups/trend-source";
import { topRecurringMerchants } from "@/lib/trends";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { OverviewDashboard } from "@/components/overview/OverviewDashboard";
import { BudgetOverview } from "@/components/overview/BudgetOverview";
import { FrequentSpots } from "@/components/overview/FrequentSpots";
import { SpendingPreview } from "@/components/overview/SpendingPreview";
import { GroupCalendar } from "./GroupCalendar";

/** Authorized Group snapshots own all values. Never substitute Personal budget
 * guidance or a paginated ledger slice for household totals/history. */
export function GroupOverview({
  data,
  month,
  onMonthChange,
  loading,
  busy,
  onEdit,
  onViewAll,
  onExplore,
  onBudget,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
  loading: boolean;
  busy: boolean;
  onEdit: (entry: GroupEntry) => void;
  onViewAll: () => void;
  onExplore: () => void;
  onBudget: () => void;
}) {
  const t = useTranslations("dashboard"),
    g = useTranslations("groups"),
    fmt = useFormatters();
  const source = useMemo(
    () =>
      groupTrendSource(data, { sharedFunds: g("sharedFunds"), uncategorized: g("uncategorized") }),
    [data, g],
  );
  const merchants = useMemo(
    () => topRecurringMerchants(source.transactions, 3),
    [source.transactions],
  );
  const remaining = data.budget.poolCents - data.summary.spendingCents;
  const net = data.summary.incomeCents - data.summary.spendingCents;
  return (
    <OverviewDashboard
      period={fmt.monthKey(month)}
      loading={loading}
      metrics={[
        { label: g("householdSpending"), cents: data.summary.spendingCents },
        { label: g("income"), cents: data.summary.incomeCents, tone: "positive" },
        { label: t("net"), cents: net, tone: net < 0 ? "negative" : "positive" },
        {
          label: t("sharedRemaining"),
          cents: data.budget.exists ? remaining : null,
          tone: data.budget.exists && remaining < 0 ? "negative" : undefined,
        },
      ]}
      calendar={(renderCards) => (
        <GroupCalendar
          renderCards={renderCards}
          data={data}
          month={month}
          onMonthChange={onMonthChange}
          onEdit={onEdit}
          onViewAll={onViewAll}
          loading={loading}
          busy={busy}
          dashboard
        />
      )}
      budget={
        <BudgetOverview
          title={t("sharedBudget")}
          label={g("remaining")}
          value={fmt.money(remaining)}
          spent={data.summary.spendingCents}
          budget={data.budget.poolCents}
          configured={data.budget.exists}
          loading={loading}
          action={
            <button type="button" onClick={onBudget} disabled={busy} className="dashboard-link">
              {t("viewBudget")}
            </button>
          }
        />
      }
      merchants={
        <FrequentSpots rows={merchants} loading={loading || source.loading} onOpen={onViewAll} />
      }
      insights={
        <SpendingPreview
          transactions={source.transactions}
          categories={source.categories}
          month={month}
          loading={loading || source.loading}
          onExplore={onExplore}
        />
      }
      actions={
        <>
          <button type="button" onClick={onViewAll} className="dashboard-link">
            {t("viewTransactions")}
          </button>
          <button type="button" onClick={onBudget} className="dashboard-link">
            {t("viewBudget")}
          </button>
        </>
      }
    />
  );
}
