"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { categoryChartColor } from "@/lib/chart-colors";
import type { OverviewInsights } from "@/lib/overview-insights";

/** Comparison-only rows and negative credits remain accessible alongside slices. */
export function SpendingInsightRows({
  rows,
  totalPositiveCents,
  selected,
  onSelect,
  limit,
  compact = false,
}: {
  rows: OverviewInsights["rows"];
  totalPositiveCents: number;
  selected: string;
  onSelect: (id: string) => void;
  limit?: number;
  compact?: boolean;
}) {
  const t = useTranslations("overview");
  const group = useTranslations("groupTrends");
  const fmt = useFormatters();
  const [expanded, setExpanded] = useState(false);
  const visible = limit && !expanded ? rows.slice(0, limit) : rows;
  return (
    <>
      <ul className={compact ? "divide-y divide-edge" : "space-y-1"}>
        {visible.map((row) => (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              aria-pressed={selected === row.id}
              className={`min-h-11 w-full rounded-[10px] px-2 ${compact ? "py-1.5" : "py-2"} text-left outline-none hover:bg-track focus-visible:ring-2 focus-visible:ring-primary`}
            >
              <div className="flex items-center gap-2 text-[12px]">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: categoryChartColor(row.color) }}
                />
                <span className="min-w-0 flex-1 break-words font-medium">
                  {row.name ?? t("categoryUncategorized")}
                </span>
                <span className="max-w-[45%] break-words text-right font-semibold tabular-nums [overflow-wrap:anywhere]">
                  {fmt.money(row.currentCents)}
                </span>
                <span className="w-10 shrink-0 text-right tabular-nums text-muted">
                  {row.currentCents > 0 && totalPositiveCents > 0
                    ? compact && row.currentCents / totalPositiveCents < 0.01
                      ? "<1%"
                      : `${Math.round((row.currentCents / totalPositiveCents) * 100)}%`
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
      {limit && rows.length > limit && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          className="min-h-11 rounded-[8px] px-2 text-label font-semibold text-primary hover:bg-track"
        >
          {group(expanded ? "showLess" : "viewAll", { count: rows.length })}
        </button>
      )}
    </>
  );
}
