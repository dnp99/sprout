"use client";

import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  buildOverviewSpendingComparison,
  type OverviewComparisonPreset,
} from "@/lib/overview-comparison";
import { formatMoney } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { ComparisonAreaChart } from "@/components/ui/ComparisonAreaChart";
import { EmptyHint } from "./EmptyHint";
import { useTranslations } from "next-intl";

const OPTIONS: { value: OverviewComparisonPreset; label: string }[] = [
  { value: "month-vs-last-month", label: "This month vs. last month" },
  { value: "month-vs-average-month", label: "This month vs. average month" },
  { value: "year-vs-last-year", label: "This year vs. last year" },
];

/** Shared Overview card for cumulative spend comparisons. It stays intentionally
 *  simpler than the dedicated Trends page: one selector, one chart, one clear
 *  answer to "am I spending more or less than a useful baseline?" */
export function OverviewSpendingComparison({
  transactions,
  className,
  compact = false,
}: {
  transactions: Transaction[];
  className?: string;
  compact?: boolean;
}) {
  const t = useTranslations("overview");
  const [preset, setPreset] = useState<OverviewComparisonPreset>("year-vs-last-year");
  const comparison = useMemo(
    () => buildOverviewSpendingComparison(transactions, preset),
    [transactions, preset],
  );
  const positiveDelta = comparison.deltaPct !== null && comparison.deltaPct > 0;
  const singlePeriod = comparison.chartMode === "single-period";
  const spendingDays = comparison.currentSpendValues
    .slice(0, comparison.visiblePointCount)
    .filter((value) => value > 0).length;

  return (
    <div
      className={`rounded-[14px] border border-edge ${compact ? "p-4" : "p-[16px_18px]"} ${className ?? ""}`}
    >
      <div className={`flex ${compact ? "flex-col gap-3" : "items-start justify-between gap-4"}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className={`${compact ? "text-[17px]" : "text-[15px]"} font-bold text-ink`}>
              {t("spending")}
            </h2>
            <span
              className={`${compact ? "text-[12px]" : "text-[13px]"} min-w-0 truncate font-semibold text-muted`}
            >
              {formatMoney(comparison.headlineAmountCents)} {comparison.headlinePeriodLabel}
            </span>
          </div>
          {singlePeriod ? (
            <p className="mt-2 text-[11px] font-medium text-muted">
              No spending {comparison.compareLabel.toLowerCase()} to compare.
            </p>
          ) : comparison.deltaPct !== null ? (
            <div
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                positiveDelta ? "bg-primary-soft text-primary" : "bg-track text-green"
              }`}
            >
              {positiveDelta ? (
                <TrendingUp size={12} strokeWidth={2.2} />
              ) : (
                <TrendingDown size={12} strokeWidth={2.2} />
              )}
              {Math.abs(comparison.deltaPct)}% vs {comparison.compareLabel.toLowerCase()}
            </div>
          ) : null}
        </div>

        <div className={`relative ${compact ? "w-full" : "w-[232px] flex-none"}`}>
          <select
            aria-label="Overview spending comparison period"
            value={preset}
            onChange={(event) => setPreset(event.target.value as OverviewComparisonPreset)}
            className={`w-full appearance-none rounded-[12px] border border-edge bg-card pr-10 font-semibold text-ink outline-none transition focus:border-primary ${compact ? "h-11 px-3.5 text-[12px]" : "h-11 px-3.5 text-[12.5px]"}`}
          >
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            strokeWidth={2.2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      </div>

      {transactions.length === 0 ? (
        <div
          className={`flex items-center justify-center ${compact ? "min-h-[240px]" : "min-h-[300px]"}`}
        >
          <EmptyHint title={t("comparisonEmpty")} />
        </div>
      ) : (
        <>
          <div className={compact ? "mt-4" : "mt-4"}>
            <ComparisonAreaChart
              comparison={comparison}
              compact={compact}
              height={compact ? 194 : 208}
            />
          </div>

          {singlePeriod ? (
            <div
              className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold ${compact ? "" : "justify-between"}`}
            >
              <LegendSwatch color="var(--primary)" label={comparison.currentLabel} />
              <span className="text-muted">
                {spendingDays} spending {spendingDays === 1 ? "day" : "days"}
              </span>
              <span className="text-muted">
                No spending {comparison.compareLabel.toLowerCase()}
              </span>
            </div>
          ) : (
            <div
              className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold ${compact ? "" : "justify-between"}`}
            >
              <LegendSwatch color="var(--primary)" label={comparison.currentLabel} />
              <LegendSwatch
                color="color-mix(in srgb, var(--muted) 75%, var(--ink) 25%)"
                label={comparison.compareLabel}
                dashed
              />
              <span className="text-muted">
                {comparison.currentLabel} {formatMoney(comparison.headlineAmountCents)} ·{" "}
                {comparison.compareLabel} {formatMoney(comparison.compareAmountCents)}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  dashed = false,
}: {
  color: string;
  label: string;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-muted">
      {dashed ? (
        <span className="w-4 border-t-2 border-dashed" style={{ borderColor: color }} />
      ) : (
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      )}
      <span>{label}</span>
    </span>
  );
}
