"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { OverviewInsights } from "@/lib/overview-insights";

export const categoryChartColor = (color: string) =>
  `color-mix(in srgb, ${color} 82%, var(--card))`;

/** The category list remains the accessible, clickable alternative to this SVG. */
export function CategorySpendingRing({
  model,
  onSelect,
}: {
  model: OverviewInsights;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("overview");
  const fmt = useFormatters();
  return (
    <div className="relative mx-auto h-[220px] w-[220px]">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
        {model.slices.map((row) => (
          <circle
            key={row.id}
            cx="60"
            cy="60"
            r="49"
            fill="none"
            strokeWidth="15"
            pathLength="100"
            stroke={categoryChartColor(row.color)}
            strokeDasharray={`${row.percent} ${100 - row.percent}`}
            strokeDashoffset={-row.offset}
            onClick={() => onSelect(row.id)}
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
}
