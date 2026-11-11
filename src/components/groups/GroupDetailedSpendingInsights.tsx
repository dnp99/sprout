"use client";

import { useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { useDesktop } from "@/hooks/useDesktop";
import { useFormatters } from "@/i18n/useFormatters";
import { UNCATEGORIZED } from "@/lib/overview-insights";
import type { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { useSpendingInsightModel } from "@/components/shared/useSpendingInsightModel";
import { SpendingInsightFilterFields } from "@/components/shared/SpendingInsightFilterFields";
import { SpendingInsightRows } from "@/components/shared/SpendingInsightRows";
import { CategorySpendingRing } from "@/components/shared/CategorySpendingRing";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";
import { ReportDateControl } from "@/components/shared/ReportDateControl";
import { Modal } from "@/components/ui/overlays";

/** Detail has an explicitly independent comparison scope. Only disclosure is
 * responsive; filters/model remain mounted across modes and viewport changes. */
export function GroupDetailedSpendingInsights({
  source,
}: {
  source: NonNullable<ComponentProps<typeof OverviewSpendingInsights>["source"]>;
}) {
  const desktop = useDesktop();
  const t = useTranslations("overview");
  const group = useTranslations("groupTrends");
  const period = useTranslations("reportPeriod");
  const fmt = useFormatters();
  const { filters, setFilters, setFilter, model, selectRow } = useSpendingInsightModel(
    source.transactions,
    source.categories,
    source.payers,
    source.month,
  );
  const [expanded, setExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const { dimension, payer, category, preset, throughDate } = filters;
  const shared = model.rows.filter((row) => row.presence === "shared");
  const unmatched = model.rows.filter((row) => row.presence !== "shared");
  const changeMonth = (month: string) => {
    setFilter("throughDate", undefined);
    source.onMonthChange(month);
  };
  const rowList = (rows: typeof model.rows) => (
    <SpendingInsightRows
      rows={rows}
      totalPositiveCents={model.totalPositiveCents}
      selected={dimension === "payer" ? payer : category}
      onSelect={selectRow}
      limit={5}
    />
  );
  const closeFilters = () => setFiltersOpen(false);
  return (
    <section
      className="spending-insights min-w-0 rounded-[10px] border border-edge bg-card p-3.5 lg:rounded-[14px] lg:p-[18px]"
      aria-label={group("detailedTitle")}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-body font-semibold text-ink">{group("detailedTitle")}</h2>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="min-h-11 shrink-0 rounded-[8px] px-2 text-label font-semibold text-primary hover:bg-track lg:hidden"
        >
          {group(expanded ? "hideAnalysis" : "showAnalysis")}
        </button>
      </div>
      <p className="mt-2 text-meta text-muted" data-comparison-scope>
        {preset === "year-vs-last-year"
          ? group("yearScope", {
              month: fmt.monthKey(source.month),
              comparison: model.comparison.compareLabel,
            })
          : group("detailScope", {
              date: model.cutoffDate,
              comparison: model.comparison.compareLabel,
            })}
      </p>
      <p className="mt-1 text-meta text-muted">{group("independentScope")}</p>
      <div className={`${expanded ? "block" : "hidden"} lg:block`}>
        <div className="my-3 flex flex-wrap items-center justify-between gap-2">
          <ReportDateControl
            mobileSheet
            month={source.month}
            date={throughDate}
            yearly={preset === "year-vs-last-year"}
            onMonthChange={changeMonth}
            onSelect={(month, date) => {
              source.onMonthChange(month);
              setFilter("throughDate", date);
            }}
          />
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            onClick={() => {
              setDraft(filters);
              setFiltersOpen(true);
            }}
            className="min-h-11 rounded-[8px] border border-edge px-3 text-label font-medium lg:hidden"
          >
            {t("reportFilters")}
          </button>
        </div>
        <div className="hidden flex-wrap items-center gap-2 lg:flex">
          <SpendingInsightFilterFields
            value={filters}
            onChange={setFilters}
            categories={source.categories}
            payers={source.payers}
          />
        </div>
        <p className="my-3 text-meta text-muted" aria-live="polite">
          {t(dimension === "payer" ? "byPayer" : "byCategory")} ·{" "}
          {source.payers.find((row) => row.id === payer)?.name ?? t("allPayers")} ·{" "}
          {category === UNCATEGORIZED
            ? t("categoryUncategorized")
            : (source.categories.find((row) => row.id === category)?.name ?? t("allCategories"))}
          {preset === "month-vs-average-month" && ` · ${t("compareAverageMonths")}`}
        </p>
        <div className="report-detail-charts items-start">
          <div className="min-w-0">
            <h3 className="mb-3 text-label font-semibold text-muted">
              {t(dimension === "payer" ? "byPayer" : "byCategory")}
            </h3>
            <CategorySpendingRing model={model} onSelect={selectRow} />
          </div>
          <div className="min-w-0">
            <h3 className="text-label font-semibold">
              {model.comparison.chartMode === "single-period"
                ? t("spending")
                : group("cumulativeTitle")}
            </h3>
            <p className="mb-4 mt-1 text-meta text-muted">
              {t("comparisonValue", { amount: fmt.money(model.comparison.compareAmountCents) })}
            </p>
            {model.rows.length ? (
              <ComparisonAreaChart
                key={`${source.month}-${category}-${preset}-${payer}-${dimension}-${throughDate ?? ""}`}
                comparison={model.comparison}
                compact={!desktop}
                height={desktop ? 248 : 194}
              />
            ) : (
              <p className="flex min-h-[194px] items-center justify-center text-body text-muted">
                {t("selectionEmpty")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-meta text-muted">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--chart-brand, var(--primary-ink))" }}
                />
                {t("selectedPeriod")}
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-4 border-t-2 border-dashed border-current" />
                {t("comparisonPeriod")}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
          {(shared.length > 0 || model.rows.length === 0) && (
            <div className="min-w-0">
              <h3 className="mb-2 text-label font-semibold">
                {t(dimension === "payer" ? "byPayer" : "byCategory")}
              </h3>
              {model.rows.length === 0 && (
                <p className="text-body text-muted">{t("selectionEmpty")}</p>
              )}
              {rowList(shared)}
            </div>
          )}
          {unmatched.length > 0 && (
            <div className="min-w-0">
              <h3 className="mb-2 text-label font-semibold text-muted">
                {t(dimension === "payer" ? "unmatchedPayers" : "unmatchedCategories")}
              </h3>
              {rowList(unmatched)}
            </div>
          )}
        </div>
      </div>
      {filtersOpen && !desktop && (
        <Modal
          title={t("reportFilters")}
          onClose={closeFilters}
          className="report-selection-dialog"
        >
          <div className="grid gap-3">
            <SpendingInsightFilterFields
              value={draft}
              onChange={setDraft}
              categories={source.categories}
              payers={source.payers}
              labeled
            />
            <button
              type="button"
              className="min-h-11 rounded-[8px] bg-primary px-3 text-label font-semibold text-onprimary"
              onClick={() => {
                setFilters(draft);
                closeFilters();
              }}
            >
              {period("apply")}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
