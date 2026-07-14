"use client";

import type { OverviewSpendingComparison } from "@/lib/overview-comparison";

const PRIMARY = "var(--primary)";
const PRIMARY_FILL = "color-mix(in srgb, var(--primary) 14%, transparent)";
const COMPARE = "color-mix(in srgb, var(--muted) 75%, var(--ink) 25%)";
const GRID = "color-mix(in srgb, var(--edge) 70%, transparent)";

function buildStepLinePath(
  values: number[],
  max: number,
  width: number,
  height: number,
  extent: number,
) {
  if (values.length === 0 || extent < 0) return "";
  const visibleValues = values.slice(0, extent + 1);
  let path = "";
  visibleValues.forEach((value, index) => {
    const x = visibleValues.length === 1 ? width / 2 : (index / (visibleValues.length - 1)) * width;
    const y = height - (value / max) * height;
    if (index === 0) {
      path = `M ${x.toFixed(2)} ${y.toFixed(2)}`;
      return;
    }
    path += ` L ${x.toFixed(2)} ${(height - (visibleValues[index - 1] / max) * height).toFixed(2)}`;
    path += ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return path;
}

function buildAreaPath(
  values: number[],
  max: number,
  width: number,
  height: number,
  extent: number,
) {
  if (values.length === 0 || extent < 0) return "";
  const line = buildStepLinePath(values, max, width, height, extent);
  const visibleValues = values.slice(0, extent + 1);
  const endX =
    visibleValues.length === 1 ? width / 2 : (extent / (visibleValues.length - 1)) * width;
  return `${line} L ${endX.toFixed(2)} ${height} L 0 ${height} Z`;
}

/** Overview chart: a cumulative comparison with a meaningful baseline, or
 *  individual spend bars when a second series would only be a zero line. */
export function ComparisonAreaChart({
  comparison,
  height = 224,
  compact = false,
}: {
  comparison: OverviewSpendingComparison;
  height?: number;
  compact?: boolean;
}) {
  const visiblePointCount = Math.max(comparison.visiblePointCount, 1);
  const isSinglePeriod = comparison.chartMode === "single-period";
  const width = (isSinglePeriod ? visiblePointCount : Math.max(visiblePointCount - 1, 1)) * 28;
  // Keep the maximum tick and its data point inside the plot, rather than
  // letting either collide with the card heading above the chart.
  const plotInset = compact ? 10 : 12;
  const plotHeight = (compact ? 146 : 164) - plotInset * 2;
  const svgHeight = plotHeight + plotInset * 2;
  const currentValues = comparison.points.map((point) => point.currentCents);
  const compareValues = comparison.points.map((point) => point.compareCents);
  const max = Math.max(comparison.maxCents, 1);
  const currentLine = buildStepLinePath(
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
  const compareLine = buildStepLinePath(
    compareValues,
    max,
    width,
    plotHeight,
    comparison.visiblePointCount - 1,
  );
  const activeValue = comparison.points[comparison.currentExtent]?.currentCents ?? 0;
  const activeX =
    comparison.visiblePointCount === 1
      ? width / 2
      : (comparison.currentExtent / (comparison.visiblePointCount - 1)) * width;
  const activeY = plotHeight - (activeValue / max) * plotHeight;
  const bars = comparison.currentSpendValues.slice(0, visiblePointCount);
  const barSlotWidth = width / visiblePointCount;
  const barWidth = Math.max(2, Math.min(18, barSlotWidth * 0.62));

  return (
    <div className="grid grid-cols-[40px_1fr] gap-3">
      <div className="relative" style={{ height }}>
        {comparison.yTicks.map((tick) => {
          const top = ((plotInset + (1 - tick.value / max) * plotHeight) / svgHeight) * 100;
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
        <div className="relative overflow-hidden px-2 py-2" style={{ height }}>
          <svg
            viewBox={`0 0 ${width} ${svgHeight}`}
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label={
              isSinglePeriod
                ? `${comparison.currentLabel} spending by ${comparison.preset.startsWith("year") ? "month" : "day"}`
                : `${comparison.currentLabel} ${comparison.headlinePeriodLabel} compared with ${comparison.compareLabel}`
            }
          >
            <g transform={`translate(0 ${plotInset})`}>
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
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}

              {isSinglePeriod ? (
                bars.map((value, index) => {
                  if (value <= 0) return null;
                  const barHeight = (value / max) * plotHeight;
                  const x = index * barSlotWidth + (barSlotWidth - barWidth) / 2;
                  return (
                    <rect
                      key={index}
                      x={x}
                      y={plotHeight - barHeight}
                      width={barWidth}
                      height={barHeight}
                      rx={Math.min(barWidth / 2, 3)}
                      fill={PRIMARY}
                    />
                  );
                })
              ) : (
                <>
                  {compareLine && (
                    <path
                      d={compareLine}
                      fill="none"
                      stroke={COMPARE}
                      strokeWidth={compact ? 2.2 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {currentArea && <path d={currentArea} fill={PRIMARY_FILL} />}

                  {currentLine && (
                    <path
                      d={currentLine}
                      fill="none"
                      stroke={PRIMARY}
                      strokeWidth={compact ? 2.4 : 2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  <circle
                    cx={activeX}
                    cy={activeY}
                    r={compact ? 3.2 : 2.8}
                    fill="var(--bg)"
                    stroke={PRIMARY}
                    strokeWidth="1.8"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
            </g>
          </svg>
        </div>

        <div className="relative mt-3 h-4">
          {comparison.xTicks.map((tick) => {
            const left =
              comparison.visiblePointCount === 1
                ? 50
                : (tick.index / (comparison.visiblePointCount - 1)) * 100;
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
