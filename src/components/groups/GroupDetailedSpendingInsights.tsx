"use client";

import { useState, useId, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { useDesktop } from "@/hooks/useDesktop";
import { useFormatters } from "@/i18n/useFormatters";
import { UNCATEGORIZED, SHARED_PAYER } from "@/lib/overview-insights";
import {
  groupInsightColors,
  insightFilterCount,
  groupComparisonCutoff,
} from "@/lib/groups/report-presentation";
import type { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { useSpendingInsightModel } from "@/components/shared/useSpendingInsightModel";
import { SpendingInsightFilterFields } from "@/components/shared/SpendingInsightFilterFields";
import { ReportDateControl } from "@/components/shared/ReportDateControl";
import { Modal } from "@/components/ui/overlays";
import { GroupInsightCharts } from "./GroupInsightCharts";

/** Follow the main month until a comparison date is explicitly chosen. Detail
 * controls then own their different analytical window, never moving main state. */
export function GroupDetailedSpendingInsights({
  source,
}: {
  source: NonNullable<ComponentProps<typeof OverviewSpendingInsights>["source"]>;
}) {
  const desktop = useDesktop(),
    t = useTranslations("overview"),
    group = useTranslations("groupTrends"),
    period = useTranslations("reportPeriod"),
    fmt = useFormatters();
  const [comparisonMonth, setComparisonMonth] = useState<string>();
  const month = comparisonMonth ?? source.month;
  const {
    filters,
    setFilters,
    setFilter,
    model: rawModel,
    selectRow,
  } = useSpendingInsightModel(source.transactions, source.categories, source.payers, month);
  const { dimension, payer, category, preset } = filters;
  // A linked main-month change makes an old exact-day cutoff inapplicable.
  const throughDate = filters.throughDate?.startsWith(month) ? filters.throughDate : undefined;
  const activeFilters = { ...filters, throughDate };
  const activeCount = insightFilterCount(activeFilters);
  const identities =
    dimension === "payer"
      ? [
          ...source.payers.map((row) => row.id),
          ...source.transactions.map((row) => row.payerId ?? SHARED_PAYER),
        ]
      : [
          ...source.categories.map((row) => row.id),
          ...source.transactions.map((row) => row.categoryId ?? UNCATEGORIZED),
        ];
  const model = groupInsightColors(rawModel, identities);
  const detailId = useId();
  const [expanded, setExpanded] = useState(false),
    [filtersOpen, setFiltersOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const changeMonth = (value: string) => {
    setComparisonMonth(value);
    setFilter("throughDate", undefined);
  };
  const closeFilters = () => setFiltersOpen(false);
  const comparisonLabel = /^\d{4}-\d{2}$/.test(model.comparison.compareLabel)
    ? fmt.monthKey(model.comparison.compareLabel)
    : preset === "month-vs-average-month"
      ? t("month-vs-average-month")
      : model.comparison.compareLabel;
  const currentLabel = preset === "year-vs-last-year" ? month.slice(0, 4) : fmt.monthKey(month);
  const previousCutoff = groupComparisonCutoff(
    month,
    preset === "year-vs-last-year",
    model.cutoffDate,
  );
  const scope =
    preset === "month-vs-average-month"
      ? group("detailScope", {
          date: fmt.shortDate(new Date(model.cutoffDate + "T12:00:00Z")),
          comparison: comparisonLabel,
        })
      : group("cutoffComparison", {
          selected:
            preset === "year-vs-last-year"
              ? fmt.monthKey(month)
              : fmt.shortDate(new Date(model.cutoffDate + "T12:00:00Z")),
          comparison:
            preset === "year-vs-last-year"
              ? fmt.monthKey(previousCutoff)
              : fmt.shortDate(new Date(previousCutoff + "T12:00:00Z")),
        });

  return (
    <section
      className="spending-insights group-detailed-insights min-w-0 rounded-[10px] border border-edge bg-card p-3.5 lg:rounded-[14px] lg:p-[18px]"
      aria-label={group("detailedTitle")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-body font-semibold text-ink">{group("detailedTitle")}</h2>
          <p className="mt-1 text-label text-muted" data-comparison-periods>
            {group("periodComparison", { selected: currentLabel, comparison: comparisonLabel })}
          </p>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailId}
          onClick={() => setExpanded(!expanded)}
          className="min-h-11 shrink-0 rounded-[8px] bg-primary px-3 text-label font-semibold text-onprimary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary active:opacity-80 lg:hidden"
        >
          {group(expanded ? "hideAnalysis" : "showAnalysis")}{" "}
          {!expanded && <span aria-hidden="true">→</span>}
        </button>
      </div>
      {!expanded && <p className="mt-2 text-meta text-muted lg:hidden">{group("detailIntro")}</p>}
      <div id={detailId} className={`${expanded ? "block" : "hidden"} lg:block`}>
        <div className="group-insight-toolbar my-3 flex flex-wrap items-center gap-2 border-y border-edge py-3">
          <ReportDateControl
            mobileSheet
            month={month}
            date={throughDate}
            yearly={preset === "year-vs-last-year"}
            onMonthChange={changeMonth}
            onSelect={(value, date) => {
              setComparisonMonth(value);
              setFilter("throughDate", date);
            }}
          />
          <div className="hidden lg:contents">
            <SpendingInsightFilterFields
              value={activeFilters}
              onChange={setFilters}
              categories={source.categories}
              payers={source.payers}
              showReset={activeCount > 0}
            />
          </div>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            onClick={() => {
              setDraft(activeFilters);
              setFiltersOpen(true);
            }}
            className="ml-auto min-h-11 rounded-[8px] border border-edge px-3 text-label font-medium lg:hidden"
          >
            {t("reportFilters")}
            {activeCount > 0 && (
              <span
                className="ml-1 rounded-full bg-primary-soft px-1.5 font-semibold text-primary"
                aria-label={group("activeFilters", { count: activeCount })}
              >
                {activeCount}
              </span>
            )}
          </button>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <p className="text-meta text-muted" data-comparison-scope>
            {scope}
          </p>
          <details className="text-meta text-muted">
            <summary className="flex min-h-11 cursor-pointer items-center font-medium text-primary">
              {group("scopeInfo")}
            </summary>
            <p className="max-w-[65ch]">{group("independentScope")}</p>
            <p className="mt-2 max-w-[65ch]">{group("comparisonMonthHelp")}</p>
            <p className="mt-2 max-w-[65ch]">{group("comparisonCutoffHelp")}</p>
          </details>
        </div>
        {comparisonMonth && comparisonMonth !== source.month && (
          <button
            type="button"
            onClick={() => {
              setComparisonMonth(undefined);
              setFilter("throughDate", undefined);
            }}
            className="mb-2 min-h-11 rounded-[8px] px-2 text-label font-medium text-primary hover:bg-track"
          >
            {group("followMainMonth", { month: fmt.monthKey(source.month) })}
          </button>
        )}
        <p className="mb-3 text-meta text-muted" aria-live="polite">
          {t(dimension === "payer" ? "byPayer" : "byCategory")} ·{" "}
          {source.payers.find((row) => row.id === payer)?.name ?? t("allPayers")} ·{" "}
          {category === UNCATEGORIZED
            ? t("categoryUncategorized")
            : (source.categories.find((row) => row.id === category)?.name ?? t("allCategories"))}
        </p>
        <GroupInsightCharts
          model={model}
          month={month}
          selected={dimension === "payer" ? payer : category}
          onSelect={selectRow}
          currentLabel={currentLabel}
          comparisonLabel={comparisonLabel}
        />
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
              showReset={insightFilterCount(draft) > 0}
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={closeFilters}
                className="min-h-11 rounded-[8px] border border-edge px-3 text-label font-medium"
              >
                {group("cancelFilters")}
              </button>
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
          </div>
        </Modal>
      )}
    </section>
  );
}
