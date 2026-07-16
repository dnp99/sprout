"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/types";
import { ChartTooltip } from "./ChartTooltip";

// Chart-specific fills (not theme tokens): terracotta for emphasis/alert, a
// calm peach for the rest. `var(--primary)` keeps the accent correct in dark.
const ACCENT = "var(--primary)";
const CALM = "#f2c89a";

/** Vertical bar chart for the 6-month spending trend. Bars over budget (or the
 *  current month) use the accent; the rest use a soft peach.
 *
 *  Optional extras, all backwards-compatible:
 *  - `tooltips` — one label per bar, revealed on hover/focus/tap.
 *  - `budgetPercent` — draws a dashed budget reference line at that height.
 *  - `point.projectedPercent` — draws a faint "paced" cap above the actual bar
 *    for the in-progress current month.
 *  - `onSelect` — makes bars report their index on click.
 *
 *  Every bar is a focusable button with an `aria-label`, so the values are
 *  reachable by keyboard, screen reader, and touch (which can't hover). */
export function BarChart({
  points,
  height = 118,
  showLabels = true,
  tooltips,
  onSelect,
  budgetPercent = null,
  budgetLabel = "Budget",
}: {
  points: TrendPoint[];
  height?: number;
  showLabels?: boolean;
  tooltips?: string[];
  onSelect?: (index: number) => void;
  budgetPercent?: number | null;
  budgetLabel?: string;
}) {
  const [active, setActive] = useState<number | null>(null);
  const interactive = Boolean(onSelect);
  const showBudget = budgetPercent !== null && budgetPercent > 0 && budgetPercent <= 100;

  return (
    <div className="relative flex items-end gap-2.5" style={{ height }}>
      {showBudget && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
          style={{ bottom: `${budgetPercent}%` }}
        >
          <div className="h-px flex-1 border-t border-dashed border-primary/55" />
          <span className="ml-1 rounded bg-primary/10 px-1 py-px text-[9px] font-semibold text-primary">
            {budgetLabel}
          </span>
        </div>
      )}

      {points.map((point, i) => {
        const colPercent = point.projectedPercent ?? point.heightPercent;
        const fill = point.current || point.over ? ACCENT : CALM;
        const label = tooltips?.[i] ?? point.label;
        const dim = active !== null && active !== i ? 0.65 : 1;
        const tooltipAlign = i === 0 ? "start" : i === points.length - 1 ? "end" : "center";
        // Solid portion (actual-so-far) as a fraction of a possibly-taller column.
        const solidPercent =
          point.projectedPercent && point.projectedPercent > 0
            ? Math.round((point.heightPercent / point.projectedPercent) * 100)
            : 100;
        const hasGhost = Boolean(
          point.projectedPercent && point.projectedPercent > point.heightPercent,
        );

        return (
          <div
            key={point.label}
            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive((h) => (h === i ? null : h))}
          >
            {/* Empty months reserve their label slot but draw no bar. */}
            {colPercent > 0 && (
              // The bar is the tooltip's positioning context, so the tooltip
              // always sits a fixed gap above the *bar top*.
              <div className="relative w-full" style={{ height: `${colPercent}%`, minHeight: 6 }}>
                {tooltips?.[i] && active === i && (
                  <ChartTooltip label={tooltips[i]} align={tooltipAlign} />
                )}
                <button
                  type="button"
                  aria-label={label}
                  onClick={() => (onSelect ? onSelect(i) : setActive((h) => (h === i ? null : i)))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((h) => (h === i ? null : h))}
                  className="relative block h-full w-full rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  style={{ opacity: dim, cursor: interactive ? "pointer" : "default" }}
                >
                  {hasGhost && (
                    <span
                      className="absolute inset-0 rounded-lg"
                      style={{ background: fill, opacity: 0.28 }}
                    />
                  )}
                  <span
                    className="absolute inset-x-0 bottom-0 rounded-lg"
                    style={{ height: `${solidPercent}%`, background: fill }}
                  />
                </button>
              </div>
            )}
            {showLabels && (
              <span
                className={`text-[11px] font-bold ${point.current ? "text-primary" : "text-muted"}`}
              >
                {point.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
