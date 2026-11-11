"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { useDesktop } from "@/hooks/useDesktop";
import type { OverviewInsights } from "@/lib/overview-insights";
import { groupCumulativeComparison } from "@/lib/groups/report-presentation";
import { CategorySpendingRing } from "@/components/shared/CategorySpendingRing";
import { SpendingInsightRows } from "@/components/shared/SpendingInsightRows";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";

/** Both analytical cards consume the same filtered model and signed net total.
 * Only the Group comparison axis/presentation is adapted; no cents are rederived. */
export function GroupInsightCharts({
  model,
  selected,
  onSelect,
  month,
  currentLabel,
  comparisonLabel,
}: {
  model: OverviewInsights;
  selected: string;
  onSelect: (id: string) => void;
  month: string;
  currentLabel: string;
  comparisonLabel: string;
}) {
  const t = useTranslations("overview"),
    group = useTranslations("groupTrends"),
    fmt = useFormatters();
  const desktop = useDesktop();
  const comparison = groupCumulativeComparison(model.comparison);
  const yearly = comparison.preset === "year-vs-last-year";
  const pointLabels = comparison.points.map((_, index) =>
    yearly
      ? fmt.shortMonthKey(`${month.slice(0, 4)}-${String(index + 1).padStart(2, "0")}`)
      : fmt.shortDate(new Date(`${month}-${String(index + 1).padStart(2, "0")}T12:00:00Z`)),
  );
  const rowList = (rows: typeof model.rows) => (
    <SpendingInsightRows
      rows={rows}
      totalPositiveCents={model.totalPositiveCents}
      selected={selected}
      onSelect={onSelect}
      limit={5}
      compact
    />
  );
  return (
    <div className="report-detail-charts items-start">
      <section className="group-insight-card" aria-label={group("distributionTitle")}>
        <h3 className="mb-3 text-body font-semibold">{group("distributionTitle")}</h3>
        <div className="group-insight-distribution">
          <CategorySpendingRing model={model} onSelect={onSelect} interactive selected={selected} />
          <div className="group-insight-rows min-w-0">
            {!model.rows.length && (
              <p className="py-3 text-body text-muted">{t("selectionEmpty")}</p>
            )}
            {rowList(model.rows)}
          </div>
        </div>
        {model.rows.some((row) => row.currentCents < 0) && (
          <p className="mt-2 text-meta text-muted">{group("creditNote")}</p>
        )}
      </section>
      <section className="group-insight-card" aria-label={group("cumulativeTitle")}>
        <h3 className="text-body font-semibold">{group("cumulativeTitle")}</h3>
        <div
          className="my-3 flex flex-wrap items-start gap-x-5 gap-y-2 text-label"
          data-comparison-totals
        >
          <div className="min-w-0">
            <span className="text-muted">{currentLabel}</span>
            <strong className="mt-1 block break-words text-body tabular-nums">
              {fmt.money(comparison.headlineAmountCents)}
            </strong>
          </div>
          <div className="min-w-0">
            <span className="text-muted">{comparisonLabel}</span>
            <strong className="mt-1 block break-words text-body tabular-nums">
              {fmt.money(comparison.compareAmountCents)}
            </strong>
          </div>
          {comparison.deltaPct !== null && (
            <span
              className={`font-semibold tabular-nums ${comparison.deltaPct <= 0 ? "text-green" : "text-danger"}`}
            >
              {comparison.deltaPct > 0 ? "+" : ""}
              {comparison.deltaPct}%
            </span>
          )}
        </div>
        {model.rows.length ? (
          <ComparisonAreaChart
            key={`${month}:${selected}:${comparison.preset}:${model.cutoffDate}`}
            comparison={comparison}
            compact={!desktop}
            height={desktop ? 184 : 168}
            detail={{
              currentLabel,
              compareLabel: comparisonLabel,
              pointLabels,
              instruction: group("comparisonHint"),
              chartLabel: group("cumulativeTitle"),
            }}
          />
        ) : (
          <p className="flex min-h-[168px] items-center justify-center text-body text-muted">
            {t("selectionEmpty")}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 text-meta text-muted">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: "var(--chart-brand, var(--primary-ink))" }}
            />
            {currentLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="w-4 border-t-2 border-dashed border-current" />
            {comparisonLabel}
          </span>
        </div>
      </section>
    </div>
  );
}
