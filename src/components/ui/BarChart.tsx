"use client";

import { useState } from "react";
import type { TrendPoint } from "@/lib/types";

/** Vertical bar chart for the 6-month spending trend. The `current` bar uses
 *  the brand color; the rest use a soft peach.
 *
 *  Interactive extras (all optional, so existing callers are unchanged):
 *  - `tooltips` — one label per bar, shown on hover.
 *  - `onSelect` — makes bars clickable (keyboard-accessible), reporting the index.
 */
export function BarChart({
  points,
  height = 118,
  showLabels = true,
  tooltips,
  onSelect,
}: {
  points: TrendPoint[];
  height?: number;
  showLabels?: boolean;
  tooltips?: string[];
  onSelect?: (index: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const interactive = Boolean(onSelect);

  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {points.map((point, i) => (
        <div
          key={point.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
        >
          {/* The bar itself is the tooltip's positioning context, so the tooltip
              always sits a fixed gap above the *bar top* — not the column top. */}
          <div
            className="relative w-full"
            style={{ height: `${point.heightPercent}%`, minHeight: interactive ? 6 : undefined }}
          >
            {tooltips?.[i] && hovered === i && (
              <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-white shadow-lg">
                {tooltips[i]}
              </div>
            )}
            {interactive ? (
              <button
                type="button"
                aria-label={tooltips?.[i] ?? point.label}
                onClick={() => onSelect?.(i)}
                className="h-full w-full rounded-lg outline-none transition-[filter,opacity] hover:brightness-95 focus-visible:ring-2 focus-visible:ring-primary/60"
                style={{
                  background: point.current ? "#d97a54" : "#f2c89a",
                  opacity: hovered === null || hovered === i ? 1 : 0.7,
                }}
              />
            ) : (
              <div
                className="h-full w-full rounded-lg"
                style={{ background: point.current ? "#d97a54" : "#f2c89a" }}
              />
            )}
          </div>
          {showLabels && <span className="text-[11px] font-bold text-muted">{point.label}</span>}
        </div>
      ))}
    </div>
  );
}
