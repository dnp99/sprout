"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { buildOverviewInsights, type SpendingRecord } from "@/lib/overview-insights";
import type { Category } from "@/lib/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { DashboardCard } from "./DashboardCard";

/** Same comparison/refund engine as detailed analysis. The explicit month-end
 * cutoff matches Overview's full-month totals, including future-dated records. */
export function SpendingPreview({
  transactions,
  categories,
  month,
  loading,
  onExplore,
}: {
  transactions: SpendingRecord[];
  categories: Category[];
  month: string;
  loading: boolean;
  onExplore: () => void;
}) {
  const t = useTranslations("dashboard"),
    o = useTranslations("overview"),
    fmt = useFormatters();
  const model = useMemo(() => {
    const [year, m] = month.split("-").map(Number);
    const throughDate = new Date(Date.UTC(year, m, 0)).toISOString().slice(0, 10);
    return buildOverviewInsights(
      transactions,
      categories,
      month,
      "month-vs-last-month",
      undefined,
      new Date(),
      { throughDate },
    );
  }, [transactions, categories, month]);
  const delta = model.comparison.deltaPct;
  return (
    <DashboardCard
      title={o("spendingInsights")}
      subtitle={t("fullMonth", { period: fmt.monthKey(month) })}
      action={
        <button type="button" onClick={onExplore} className="dashboard-link">
          {t("exploreTrends")}
        </button>
      }
    >
      {loading ? (
        <SkeletonRows rows={3} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p className="dashboard-budget-value">
              {fmt.money(model.comparison.headlineAmountCents)}
            </p>
            <p className={`text-meta ${delta !== null && delta < 0 ? "text-green" : "text-muted"}`}>
              {delta === null
                ? t("noComparison")
                : t("comparison", {
                    change: `${delta > 0 ? "+" : ""}${new Intl.NumberFormat(fmt.locale, { maximumFractionDigits: 1 }).format(delta)}`,
                  })}
            </p>
          </div>
          {!model.slices.length ? (
            <p className="text-body text-muted">{t("noSpending")}</p>
          ) : (
            <ul className="dashboard-category-preview">
              {model.slices.slice(0, 3).map((row) => (
                <li key={row.id} className="min-w-0">
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-label">
                    <span className="min-w-0 truncate font-medium">
                      {row.name ?? o("categoryUncategorized")}
                    </span>
                    <span className="shrink-0 tabular-nums">{Math.round(row.percent)}%</span>
                  </div>
                  <ProgressBar percent={row.percent} color="var(--primary-outline)" />
                  <p className="mt-1 break-words text-meta tabular-nums text-muted">
                    {fmt.money(row.currentCents)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {model.rows.some((row) => row.currentCents < 0) && (
            <p className="mt-3 text-meta text-muted">{t("creditsHint")}</p>
          )}
        </>
      )}
      <p className="mt-3 text-meta text-muted">{t("trendsScope")}</p>
    </DashboardCard>
  );
}
