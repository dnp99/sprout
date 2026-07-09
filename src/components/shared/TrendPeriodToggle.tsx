"use client";

import type { TrendPeriod } from "@/lib/reports";

const PERIODS: { value: TrendPeriod; web: string; mobile: string }[] = [
  { value: "month", web: "This month", mobile: "Month" },
  { value: "6m", web: "Last 6 months", mobile: "6 mo" },
  { value: "12m", web: "Last 12 months", mobile: "12 mo" },
  { value: "ytd", web: "Year to date", mobile: "YTD" },
];

/** Segmented control for the Trends reporting period. `compact` renders the
 *  short mobile labels + tighter padding; otherwise the full desktop labels.
 *  Shared by the web view and the mobile screen. */
export function TrendPeriodToggle({
  period,
  onChange,
  compact = false,
}: {
  period: TrendPeriod;
  onChange: (period: TrendPeriod) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`inline-flex rounded-[10px] bg-track ${compact ? "w-full gap-0.5 p-[3px]" : "gap-0.5 p-1"}`}
    >
      {PERIODS.map((p) => {
        const active = p.value === period;
        return (
          <button
            key={p.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(p.value)}
            className={`rounded-[7px] font-semibold transition ${
              compact ? "flex-1 py-[7px] text-[11px]" : "px-[13px] py-[7px] text-[12px]"
            } ${active ? "bg-primary text-onprimary" : "text-muted hover:text-ink"}`}
          >
            {compact ? p.mobile : p.web}
          </button>
        );
      })}
    </div>
  );
}
