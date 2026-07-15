"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { monthKeyLabel } from "@/lib/trends";
import type { CashFlowMonth, PaceProjection } from "@/lib/cash-flow";
import { ChartTooltip } from "@/components/ui/ChartTooltip";

export type CashFlowChartType = "bar" | "line";

/** Shared cash-flow plot for the web + mobile Trends views (plan 012). Renders
 *  the same income/expense series two ways — `bar` (income up / expense down from
 *  a $0 baseline, net line overlaid) or `line` (income + expense as lines, the
 *  gap between them = savings) — plus a dashed current-month pace projection on
 *  the expense side. Columns are clickable to change the selected month.
 *  `dense` shrinks it for the phone layout so both surfaces stay pixel-identical. */
export function CashFlowChart({
  series,
  selectedKey,
  chartType,
  projection,
  onPick,
  dense = false,
}: {
  series: CashFlowMonth[];
  selectedKey: string;
  chartType: CashFlowChartType;
  projection: PaceProjection | null;
  onPick: (key: string) => void;
  dense?: boolean;
}) {
  // Bars/lines scale to the largest single-side magnitude in the window — the
  // projected full-month expense is included so its ghost never overflows.
  const maxMag = Math.max(
    1,
    ...series.map((m) => Math.max(m.incomeCents, m.expenseCents)),
    projection?.projectedExpenseCents ?? 0,
  );
  const pct = (v: number) => `${Math.min(100, Math.round((v / maxMag) * 100))}%`;
  // One label string drives both the screen-reader aria-label and the visible
  // hover/tap pill, so touch users can read a column's income/expense split
  // (the top stat cards only show the *selected* month).
  const detailLabel = (m: CashFlowMonth) =>
    `${monthKeyLabel(m.key)} · income ${formatMoney(m.incomeCents)} · expenses ${formatMoney(m.expenseCents)}`;
  const [active, setActive] = useState<string | null>(null);
  const x = (i: number) => (series.length === 1 ? 50 : (i / (series.length - 1)) * 100);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));

  // Bar mode: net line in a 0–100 box where y=50 is $0, y=0 is +maxMag.
  const netPoints = series
    .map((m, i) => `${x(i)},${clamp(50 - (m.netCents / maxMag) * 50)}`)
    .join(" ");
  // Line mode: income + expense as magnitudes off a bottom baseline (y=100).
  const linePoints = (pick: (m: CashFlowMonth) => number) =>
    series.map((m, i) => `${x(i)},${clamp(100 - (pick(m) / maxMag) * 100)}`).join(" ");

  return (
    <>
      <div className={`relative ${dense ? "h-[92px]" : "h-[150px]"}`}>
        {chartType === "line" ? (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={linePoints((m) => m.incomeCents)}
              className="text-green"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <polyline
              points={linePoints((m) => m.expenseCents)}
              className="text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {projection && (
              // Dashed "headed here" segment from actual → projected spend on the
              // current month's column.
              <ProjectionLineTick
                series={series}
                projection={projection}
                x={x}
                maxMag={maxMag}
                clamp={clamp}
              />
            )}
          </svg>
        ) : (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full text-ink"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <polyline
              points={netPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}

        <div className={`flex h-full items-stretch ${dense ? "gap-2" : "gap-3"}`}>
          {series.map((m) => {
            const isSel = m.key === selectedKey;
            const ghost = projection?.key === m.key;
            const extra = ghost
              ? Math.max(0, projection!.projectedExpenseCents - m.expenseCents)
              : 0;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => onPick(m.key)}
                onMouseEnter={() => setActive(m.key)}
                onMouseLeave={() => setActive((h) => (h === m.key ? null : h))}
                onFocus={() => setActive(m.key)}
                onBlur={() => setActive((h) => (h === m.key ? null : h))}
                aria-label={detailLabel(m)}
                className={`group relative flex flex-1 flex-col rounded-[6px] px-0.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isSel ? "bg-track" : ""}`}
              >
                {active === m.key && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2">
                    <div className="relative">
                      <ChartTooltip label={detailLabel(m)} />
                    </div>
                  </div>
                )}
                {/* Income (up) */}
                <div className="flex flex-1 flex-col justify-end">
                  {chartType === "bar" && (
                    <div
                      className={`w-full rounded-t-[5px] bg-green transition-opacity ${isSel ? "" : "opacity-[.28] group-hover:opacity-60"}`}
                      style={{ height: pct(m.incomeCents) }}
                    />
                  )}
                </div>
                <div className="h-px w-full bg-edge" />
                {/* Expense (down) + projected pace ghost */}
                <div className="flex flex-1 flex-col justify-start">
                  {chartType === "bar" && (
                    <div
                      className={`w-full rounded-b-[5px] bg-primary transition-opacity ${isSel ? "" : "opacity-[.28] group-hover:opacity-60"}`}
                      style={{ height: pct(m.expenseCents) }}
                    />
                  )}
                  {ghost && chartType === "bar" && extra > 0 && (
                    <div
                      className="w-full rounded-b-[5px] border border-dashed border-primary/70 bg-primary/[.12]"
                      style={{ height: pct(extra) }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className={`flex ${dense ? "mt-2 gap-2" : "mt-1.5 gap-3"}`}>
        {series.map((m) => (
          <span
            key={m.key}
            className={`flex-1 text-center font-semibold ${dense ? "text-[9.5px]" : "text-[10px]"} ${m.key === selectedKey ? "text-ink" : "text-muted"}`}
          >
            {m.label}
          </span>
        ))}
      </div>
    </>
  );
}

/** The line-mode pace indicator: a dashed vertical from the current month's actual
 *  expense point up to its projected full-month point. */
function ProjectionLineTick({
  series,
  projection,
  x,
  maxMag,
  clamp,
}: {
  series: CashFlowMonth[];
  projection: PaceProjection;
  x: (i: number) => number;
  maxMag: number;
  clamp: (v: number) => number;
}) {
  const i = series.findIndex((m) => m.key === projection.key);
  if (i < 0) return null;
  const yActual = clamp(100 - (series[i].expenseCents / maxMag) * 100);
  const yProjected = clamp(100 - (projection.projectedExpenseCents / maxMag) * 100);
  return (
    <polyline
      points={`${x(i)},${yActual} ${x(i)},${yProjected}`}
      className="text-primary"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeDasharray="3 2"
      vectorEffect="non-scaling-stroke"
    />
  );
}
