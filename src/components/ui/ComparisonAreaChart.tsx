"use client";

import type { OverviewSpendingComparison } from "@/lib/overview-comparison";

const PRIMARY = "var(--primary)";
const PRIMARY_FILL = "color-mix(in srgb, var(--primary) 22%, transparent)";
const COMPARE = "color-mix(in srgb, var(--muted) 75%, var(--ink) 25%)";
const GRID = "color-mix(in srgb, var(--edge) 70%, transparent)";

function buildLinePath(
  values: number[],
  max: number,
  width: number,
  height: number,
  extent = values.length - 1,
) {
  if (values.length === 0 || extent < 0) return "";
  return values
    .slice(0, extent + 1)
    .map((value, index) => {
      const x = values.length === 1 ? width / 2 : (index / (values.length - 1)) * width;
      const y = height - (value / max) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildAreaPath(
  values: number[],
  max: number,
  width: number,
  height: number,
  extent: number,
) {
  if (values.length === 0 || extent < 0) return "";
  const line = buildLinePath(values, max, width, height, extent);
  const endX = values.length === 1 ? width / 2 : (extent / (values.length - 1)) * width;
  return `${line} L ${endX.toFixed(2)} ${height} L 0 ${height} Z`;
}

/** Lightweight cumulative comparison chart for Overview. The current period is
 *  filled so it reads at a glance; the baseline stays as a neutral line. */
export function ComparisonAreaChart({
  comparison,
  height = 224,
  compact = false,
}: {
  comparison: OverviewSpendingComparison;
  height?: number;
  compact?: boolean;
}) {
  const width = 100;
  const plotHeight = 100;
  const currentValues = comparison.points.map((point) => point.currentCents);
  const compareValues = comparison.points.map((point) => point.compareCents);
  const max = Math.max(comparison.maxCents, 1);
  const currentLine = buildLinePath(
    currentValues,
    max,
    width,
    plotHeight,
    comparison.currentExtent,
  );
  const currentArea = buildAreaPath(
    currentValues,
    max,
    width,
    plotHeight,
    comparison.currentExtent,
  );
  const compareLine = buildLinePath(compareValues, max, width, plotHeight);
  const activeValue = comparison.points[comparison.currentExtent]?.currentCents ?? 0;
  const activeX =
    comparison.points.length === 1
      ? width / 2
      : (comparison.currentExtent / (comparison.points.length - 1)) * width;
  const activeY = plotHeight - (activeValue / max) * plotHeight;

  return (
    <div className="grid grid-cols-[44px_1fr] gap-3">
      <div className="relative" style={{ height }}>
        {comparison.yTicks.map((tick) => {
          const top = 100 - (tick.value / max) * 100;
          return (
            <span
              key={tick.label}
              className="absolute right-0 -translate-y-1/2 text-[10px] font-semibold text-muted"
              style={{ top: `${top}%` }}
            >
              {tick.label}
            </span>
          );
        })}
      </div>

      <div>
        <div className="relative" style={{ height }}>
          <svg
            viewBox={`0 0 ${width} ${plotHeight}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={`${comparison.currentLabel} ${comparison.headlinePeriodLabel} compared with ${comparison.compareLabel}`}
          >
            {comparison.yTicks.map((tick) => {
              const y = plotHeight - (tick.value / max) * plotHeight;
              return (
                <line
                  key={tick.label}
                  x1="0"
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke={GRID}
                  strokeWidth="0.6"
                />
              );
            })}

            {compareLine && (
              <path
                d={compareLine}
                fill="none"
                stroke={COMPARE}
                strokeWidth={compact ? 1.8 : 1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {currentArea && <path d={currentArea} fill={PRIMARY_FILL} />}

            {currentLine && (
              <path
                d={currentLine}
                fill="none"
                stroke={PRIMARY}
                strokeWidth={compact ? 2.6 : 2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            <circle
              cx={activeX}
              cy={activeY}
              r={compact ? 2.4 : 2.1}
              fill="var(--bg)"
              stroke={PRIMARY}
              strokeWidth="1.8"
            />
          </svg>
        </div>

        <div className="relative mt-3 h-4">
          {comparison.xTicks.map((tick) => {
            const left =
              comparison.points.length === 1
                ? 50
                : (tick.index / (comparison.points.length - 1)) * 100;
            return (
              <span
                key={`${tick.index}-${tick.label}`}
                className="absolute -translate-x-1/2 text-[10px] font-semibold text-muted"
                style={{ left: `${left}%` }}
              >
                {tick.label}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
