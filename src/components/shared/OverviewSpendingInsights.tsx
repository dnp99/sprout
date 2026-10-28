"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { useFormatters } from "@/i18n/useFormatters";
import { resolveViewMonth } from "@/lib/trends";
import {
  ALL_CATEGORIES,
  UNCATEGORIZED,
  buildOverviewInsights,
  type SpendingRecord,
  type SpendingPayer,
  type SpendingDimension,
} from "@/lib/overview-insights";
import type { Category } from "@/lib/types";
import type { OverviewComparisonPreset } from "@/lib/overview-comparison";
import { Select } from "@/components/ui/Select";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";
import { ReportDateControl } from "./ReportDateControl";
import { CategorySpendingRing, categoryChartColor } from "./CategorySpendingRing";

/** Shared controls own both views: selecting a legend row is a category filter,
 * rather than a cosmetic highlight disconnected from the time chart. */
export function OverviewSpendingInsights({
  compact = false,
  className = "",
  source,
}: {
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
  const viewMonth = useStore((s) => s.viewMonthKey);
  const [monthOverride, setMonthOverride] = useState("");
  const [throughDate, setThroughDate] = useState<string | undefined>();
  const [dimension, setDimension] = useState<SpendingDimension>("category");
  const [payer, setPayer] = useState(ALL_CATEGORIES);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [preset, setPreset] = useState<OverviewComparisonPreset>("month-vs-last-month");
  const month = source?.month || monthOverride || resolveViewMonth(viewMonth, transactions);
  const model = useMemo(
    () =>
      buildOverviewInsights(transactions, categories, month, preset, category, new Date(), {
        dimension,
        payer,
        payers,
        throughDate,
      }),
    [transactions, categories, month, preset, category, dimension, payer, payers, throughDate],
  );
  const t = useTranslations("overview");
  const fmt = useFormatters();
  const changeMonth = (value: string) => {
    setThroughDate(undefined);
    if (source) source.onMonthChange(value);
    else setMonthOverride(value);
  };
  const selectRow = (id: string) =>
    dimension === "payer"
      ? setPayer(payer === id ? ALL_CATEGORIES : id)
      : setCategory(category === id ? ALL_CATEGORIES : id);
  const shared = model.rows.filter((row) => row.presence === "shared");
  const unmatched = model.rows.filter((row) => row.presence !== "shared");
  const presets: OverviewComparisonPreset[] = [
    "month-vs-last-month",
    "month-vs-average-month",
    "year-vs-last-year",
  ];
  const currentLabel =
    preset === "year-vs-last-year"
      ? t("selectedYear", { year: month.slice(0, 4) })
      : throughDate
        ? fmt.shortDate(new Date(throughDate + "T12:00:00Z"))
        : fmt.monthKey(month);
  const rowList = (rows: typeof model.rows) => (
    <ul className="space-y-1">
      {rows.map((row) => (
        <li key={row.id}>
          <button
            type="button"
            onClick={() => selectRow(row.id)}
            aria-pressed={(dimension === "payer" ? payer : category) === row.id}
            className="min-h-11 w-full rounded-[10px] px-2 py-2 text-left outline-none hover:bg-track focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center gap-2 text-[12px]">
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ background: categoryChartColor(row.color) }}
              />
              <span className="min-w-0 flex-1 font-medium">
                {row.name ?? t("categoryUncategorized")}
              </span>
              <span className="font-semibold tabular-nums">{fmt.money(row.currentCents)}</span>
              <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                {row.currentCents > 0
                  ? `${Math.round((row.currentCents / model.totalPositiveCents) * 100)}%`
                  : "—"}
              </span>
            </div>
            <div className="ml-4 mt-1 text-[10.5px] text-muted">
              {t(
                row.presence === "current-only"
                  ? "onlySelectedPeriod"
                  : row.presence === "comparison-only"
                    ? "onlyComparisonPeriod"
                    : "comparisonValue",
                { amount: fmt.money(row.compareCents) },
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
  return (
    <section
      aria-label={t("spendingInsights")}
      className={`spending-insights rounded-card border border-edge bg-card p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-bold">{t("spendingInsights")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <ReportDateControl
            month={month}
            date={throughDate}
            yearly={preset === "year-vs-last-year"}
            onMonthChange={changeMonth}
            onSelect={(value, date) => {
              changeMonth(value);
              setThroughDate(date);
            }}
          />
          <Select
            aria-label={t("comparisonPeriod")}
            value={preset}
            onChange={(e) => {
              setPreset(e.target.value as OverviewComparisonPreset);
              setThroughDate(undefined);
            }}
            className="min-h-11 rounded-[10px] border border-edge bg-card px-3 text-[12px] font-semibold text-ink"
          >
            {presets.map((value) => (
              <option key={value} value={value}>
                {t(value)}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t("viewBy")}
            value={dimension}
            onChange={(e) => setDimension(e.target.value as SpendingDimension)}
            className="min-h-11 rounded-[10px] border border-edge bg-card px-3 text-[12px] font-semibold text-ink"
          >
            <option value="category">{t("byCategory")}</option>
            <option value="payer">{t("byPayer")}</option>
          </Select>
          <Select
            aria-label={t("payerFilter")}
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            className="min-h-11 rounded-[10px] border border-edge bg-card px-3 text-[12px] font-semibold text-ink"
          >
            <option value={ALL_CATEGORIES}>{t("allPayers")}</option>
            {payers.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
          </Select>
          <Select
            aria-label={t("categoryFilter")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-11 rounded-[10px] border border-edge bg-card px-3 text-[12px] font-semibold text-ink"
          >
            <option value={ALL_CATEGORIES}>{t("allCategories")}</option>
            {categories.map((row) => (
              <option key={row.id} value={row.id}>
                {row.name}
              </option>
            ))}
            <option value={UNCATEGORIZED}>{t("categoryUncategorized")}</option>
          </Select>
        </div>
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
