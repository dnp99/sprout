"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ALL_CATEGORIES, UNCATEGORIZED, type SpendingPayer } from "@/lib/overview-insights";
import type { Category } from "@/lib/types";
import type { OverviewComparisonPreset } from "@/lib/overview-comparison";
import { Select } from "@/components/ui/Select";
import { DEFAULT_INSIGHT_FILTERS, type SpendingInsightFilters } from "./useSpendingInsightModel";

/** Filters share choices and reset semantics; only sheet drafts defer applying. */
export function SpendingInsightFilterFields({
  value,
  onChange,
  payers,
  categories,
  labeled = false,
  showReset = true,
}: {
  value: SpendingInsightFilters;
  onChange: (value: SpendingInsightFilters) => void;
  payers: SpendingPayer[];
  categories: Category[];
  labeled?: boolean;
  showReset?: boolean;
}) {
  const t = useTranslations("overview");
  const field = (label: string, children: ReactNode) =>
    labeled ? (
      <label className="grid min-w-0 gap-1 text-label font-medium text-muted">
        {label}
        {children}
      </label>
    ) : (
      children
    );
  const style =
    "min-h-11 min-w-0 max-w-full rounded-[10px] border border-edge bg-card px-3 text-[12px] font-semibold text-ink";
  return (
    <>
      {field(
        t("comparisonPeriod"),
        <Select
          aria-label={t("comparisonPeriod")}
          value={value.preset}
          onChange={(e) =>
            onChange({
              ...value,
              preset: e.target.value as OverviewComparisonPreset,
              throughDate: undefined,
            })
          }
          className={style}
        >
          {(["month-vs-last-month", "month-vs-average-month", "year-vs-last-year"] as const).map(
            (preset) => (
              <option key={preset} value={preset}>
                {t(preset)}
              </option>
            ),
          )}
        </Select>,
      )}
      {field(
        t("viewBy"),
        <Select
          aria-label={t("viewBy")}
          value={value.dimension}
          onChange={(e) =>
            onChange({ ...value, dimension: e.target.value as SpendingInsightFilters["dimension"] })
          }
          className={style}
        >
          <option value="category">{t("byCategory")}</option>
          <option value="payer">{t("byPayer")}</option>
        </Select>,
      )}
      {field(
        t("payerFilter"),
        <Select
          aria-label={t("payerFilter")}
          value={value.payer}
          onChange={(e) => onChange({ ...value, payer: e.target.value })}
          className={style}
        >
          <option value={ALL_CATEGORIES}>{t("allPayers")}</option>
          {payers.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </Select>,
      )}
      {field(
        t("categoryFilter"),
        <Select
          aria-label={t("categoryFilter")}
          value={value.category}
          onChange={(e) => onChange({ ...value, category: e.target.value })}
          className={style}
        >
          <option value={ALL_CATEGORIES}>{t("allCategories")}</option>
          {categories.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
          <option value={UNCATEGORIZED}>{t("categoryUncategorized")}</option>
        </Select>,
      )}
      {showReset && (
        <button
          type="button"
          className="min-h-11 px-3 text-xs font-medium text-muted"
          onClick={() => onChange(DEFAULT_INSIGHT_FILTERS)}
        >
          {t("resetReportFilters")}
        </button>
      )}
    </>
  );
}
