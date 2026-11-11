"use client";

import { useId, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";
import { resolveViewMonth } from "@/lib/trends";
import {
  ALL_CATEGORIES,
  UNCATEGORIZED,
  type SpendingRecord,
  type SpendingPayer,
} from "@/lib/overview-insights";
import type { Category } from "@/lib/types";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";
import { ReportDateControl } from "./ReportDateControl";
import { CategorySpendingRing } from "./CategorySpendingRing";
import { useSpendingInsightModel } from "./useSpendingInsightModel";
import { SpendingInsightFilterFields } from "./SpendingInsightFilterFields";
import { SpendingInsightRows } from "./SpendingInsightRows";

// The header slot is stable for this report's lifetime. React rechecks this
// snapshot after hydration/commit, when the parent header DOM is available.
const subscribeToHeaderSlot = () => () => {};

/** Shared controls own both views: selecting a legend row is a category filter,
 * rather than a cosmetic highlight disconnected from the time chart. */
export function OverviewSpendingInsights({
  compact = false,
  className = "",
  source,
  dateControlTargetId,
}: {
  dateControlTargetId?: string;
  compact?: boolean;
  className?: string;
  source?: {
    transactions: SpendingRecord[];
    categories: Category[];
    payers: SpendingPayer[];
    month: string;
    onMonthChange: (month: string) => void;
    loading: boolean;
  };
}) {
  const dateControlHost = useSyncExternalStore(
    subscribeToHeaderSlot,
    () => (dateControlTargetId ? document.getElementById(dateControlTargetId) : null),
    () => null,
  );
  const personalTransactions = useStore((s) => s.transactions);
  const user = useStore((s) => s.user);
  const personalCategories = useStore((s) => s.categories);
  const personalLoading = useStore((s) => s.transactionsLoading);
  const transactions = useMemo(
    () => source?.transactions ?? personalTransactions.map((row) => ({ ...row, payerId: user.id })),
    [source?.transactions, personalTransactions, user.id],
  );
  const categories = source?.categories ?? personalCategories;
  const payers = useMemo(
    () =>
      source?.payers ?? [
        { id: user.id, name: user.name, color: "var(--chart-brand, var(--primary-ink))" },
      ],
    [source?.payers, user.id, user.name],
  );
  const loading = source?.loading ?? personalLoading;
  const filterId = useId();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const viewMonth = useStore((s) => s.viewMonthKey);
  const [monthOverride, setMonthOverride] = useState("");
  const month = source?.month || monthOverride || resolveViewMonth(viewMonth, transactions);
  const { filters, setFilters, model, selectRow, setFilter } = useSpendingInsightModel(
    transactions,
    categories,
    payers,
    month,
  );
  const { throughDate, dimension, payer, category, preset } = filters;
  const setThroughDate = (value: string | undefined) => setFilter("throughDate", value);
  const t = useTranslations("overview");
  const fmt = useFormatters();
  const changeMonth = (value: string) => {
    setThroughDate(undefined);
    if (source) source.onMonthChange(value);
    else setMonthOverride(value);
  };
  const shared = model.rows.filter((row) => row.presence === "shared");
  const unmatched = model.rows.filter((row) => row.presence !== "shared");
  const currentLabel =
    preset === "year-vs-last-year"
      ? t("selectedYear", { year: month.slice(0, 4) })
      : throughDate
        ? fmt.shortDate(new Date(throughDate + "T12:00:00Z"))
        : fmt.monthKey(month);
  const rowList = (rows: typeof model.rows) => (
    <SpendingInsightRows
      rows={rows}
      totalPositiveCents={model.totalPositiveCents}
      selected={dimension === "payer" ? payer : category}
      onSelect={selectRow}
    />
  );
  // Portal the same stateful control so yearly presets and exact-day cutoffs
  // remain coupled to this report when its date UI moves into page chrome.
  const dateControl = (
    <ReportDateControl
      className="calendar-month-control"
      month={month}
      date={throughDate}
      yearly={preset === "year-vs-last-year"}
      onMonthChange={changeMonth}
      onSelect={(value, date) => {
        changeMonth(value);
        setThroughDate(date);
      }}
    />
  );
  return (
    <section
      aria-label={t("spendingInsights")}
      className={`spending-insights rounded-card border border-edge bg-card p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{t("spendingInsights")}</h2>
        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
          {!dateControlTargetId && <span className="text-xs text-muted">{t("reportPeriod")}</span>}
          {dateControlTargetId
            ? dateControlHost && createPortal(dateControl, dateControlHost)
            : dateControl}
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls={filterId}
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="min-h-11 rounded-[10px] border border-edge px-3 text-xs font-semibold lg:hidden"
          >
            {t("reportFilters")}
          </button>
        </div>
      </div>
      <div
        id={filterId}
        className={`${filtersOpen ? "flex" : "hidden"} mt-3 flex-col gap-2 lg:flex lg:flex-row lg:flex-wrap`}
      >
        <SpendingInsightFilterFields
          value={filters}
          onChange={setFilters}
          payers={payers}
          categories={categories}
        />
      </div>
      <p className="mt-2 text-[11px] text-muted">
        {currentLabel} ·{" "}
        {t(
          preset === "year-vs-last-year"
            ? "comparePreviousYear"
            : preset === "month-vs-average-month"
              ? "compareAverageMonths"
              : "comparePreviousMonth",
        )}
      </p>
      <p className="mt-1 text-xs text-muted" aria-live="polite">
        {t(dimension === "payer" ? "byPayer" : "byCategory")} ·{" "}
        {payers.find((row) => row.id === payer)?.name ?? t("allPayers")} ·{" "}
        {category === UNCATEGORIZED
          ? t("categoryUncategorized")
          : (categories.find((row) => row.id === category)?.name ?? t("allCategories"))}
      </p>
      {loading ? (
        <SkeletonRows rows={5} className="mt-5" />
      ) : (
        <div className="mt-6 grid items-start gap-7 xl:grid-cols-[1fr_1.1fr]">
          <div className="grid items-center gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
            <CategorySpendingRing model={model} onSelect={selectRow} />
            <div>
              <h3 className="mb-2 text-[12px] font-semibold">
                {t(dimension === "payer" ? "byPayer" : "byCategory")}
              </h3>
              {!model.rows.length && (
                <p className="py-5 text-[12px] text-muted">{t("selectionEmpty")}</p>
              )}
              {rowList(shared)}
              {unmatched.length > 0 && (
                <div className={shared.length ? "mt-3 border-t border-edge pt-3" : ""}>
                  <h4 className="mb-1 text-[11px] font-semibold text-muted">
                    {t(dimension === "payer" ? "unmatchedPayers" : "unmatchedCategories")}
                  </h4>
                  {rowList(unmatched)}
                </div>
              )}
            </div>
          </div>
          <div className="min-w-0">
            <div className="mb-4 flex flex-wrap justify-between gap-2 text-[12px]">
              <strong>
                {currentLabel} · {fmt.money(model.comparison.headlineAmountCents)}
              </strong>
              <span className="text-muted">
                {t("comparisonValue", { amount: fmt.money(model.comparison.compareAmountCents) })}
              </span>
            </div>
            {model.rows.length ? (
              <ComparisonAreaChart
                key={`${month}-${category}-${preset}-${payer}-${dimension}-${throughDate ?? ""}`}
                comparison={model.comparison}
                compact={compact}
                height={compact ? 194 : 248}
              />
            ) : (
              <p className="flex min-h-[200px] items-center justify-center text-[12px] text-muted">
                {t("selectionEmpty")}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: "var(--chart-brand, var(--primary))" }}
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
      )}
    </section>
  );
}
