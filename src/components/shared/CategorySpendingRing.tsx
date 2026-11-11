"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { OverviewInsights } from "@/lib/overview-insights";
import { categoryChartColor } from "@/lib/chart-colors";
import { useState } from "react";

/** The category list remains the accessible, clickable alternative to this SVG. */
export function CategorySpendingRing({
  model,
  onSelect,
  interactive = false,
  selected,
}: {
  model: OverviewInsights;
  onSelect: (id: string) => void;
  interactive?: boolean;
  selected?: string;
}) {
  const t = useTranslations("overview");
  const fmt = useFormatters();
  const group = useTranslations("groupTrends");
  const [active, setActive] = useState<string | null>(null);
  const activeRow = model.slices.find((row) => row.id === active);
  const detail = (row: (typeof model.slices)[number]) =>
    `${row.name ?? t("categoryUncategorized")} · ${fmt.money(row.currentCents)} · ${row.percent < 1 ? "<1" : Math.round(row.percent)}%`;
  const ring = (
    <div
      className={`relative mx-auto h-[220px] w-[220px] ${interactive ? "group-insight-ring" : ""}`}
    >
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full -rotate-90"
        aria-hidden={interactive ? undefined : true}
        role={interactive ? "group" : undefined}
        aria-label={interactive ? group("distributionTitle") : undefined}
      >
        {model.slices.map((row) => (
          <circle
            key={row.id}
            cx="60"
            cy="60"
            r="49"
            fill="none"
            strokeWidth={interactive && selected === row.id ? 17 : 15}
            pathLength="100"
            stroke={categoryChartColor(row.color)}
            strokeDasharray={
              interactive && model.slices.length > 1
                ? `${Math.max(0.01, row.percent - Math.min(0.5, row.percent * 0.2))} ${100 - Math.max(0.01, row.percent - Math.min(0.5, row.percent * 0.2))}`
                : `${row.percent} ${100 - row.percent}`
            }
            strokeDashoffset={-row.offset}
            onClick={() => {
              if (interactive) setActive(row.id);
              onSelect(row.id);
            }}
            role={interactive ? "button" : undefined}
            tabIndex={interactive ? 0 : undefined}
            aria-label={interactive ? detail(row) : undefined}
            aria-pressed={interactive ? selected === row.id : undefined}
            onMouseEnter={interactive ? () => setActive(row.id) : undefined}
            onFocus={interactive ? () => setActive(row.id) : undefined}
            onKeyDown={
              interactive
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActive(row.id);
                      onSelect(row.id);
                    }
                  }
                : undefined
            }
            className="cursor-pointer transition-opacity hover:opacity-75"
          />
        ))}
        {!model.slices.length && (
          <circle cx="60" cy="60" r="49" fill="none" strokeWidth="15" stroke="var(--muted-bg)" />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
        <span className="text-[11px] text-muted">{t("spending")}</span>
        <strong className="mt-1 text-[19px] tabular-nums">
          {fmt.money(model.comparison.headlineAmountCents)}
        </strong>
      </div>
    </div>
  );
  return interactive ? (
    <div className="min-w-0">
      {ring}
      <p
        role="status"
        className="mt-2 h-16 overflow-auto rounded-[8px] bg-track p-2 text-meta text-muted"
      >
        {!model.slices.length
          ? group("noPositiveSpending")
          : activeRow
            ? detail(activeRow)
            : group("distributionHint")}
      </p>
    </div>
  ) : (
    ring
  );
}
