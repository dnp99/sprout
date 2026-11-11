"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { formatMoney } from "@/lib/format";
import { useFormatters } from "@/i18n/useFormatters";
import type { TrendsReport } from "@/lib/reports";

/** Spending report plot with explicit money and time axes. Shared across web
 * and mobile so scaling, labels, tooltip behavior, and drill-down stay aligned. */
export function SpendingBarChart({
  chart,
  compact = false,
  onSelectMonth,
  expanded = false,
  futureKeys = [],
}: {
  chart: TrendsReport["chart"];
  compact?: boolean;
  onSelectMonth: (key: string) => void;
  /** Group reports opt into a readable plot and bounded selected-point feedback. */
  expanded?: boolean;
  futureKeys?: string[];
}) {
  const t = useTranslations("trends");
  const group = useTranslations("groupTrends");
  const fmt = useFormatters();
  const dateLabel = (key: string) =>
    new Intl.DateTimeFormat(fmt.locale, {
      month: "short",
      ...(key.length === 10 ? { day: "numeric" } : {}),
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(key.length === 10 ? key + "T12:00:00Z" : key + "-01T12:00:00Z"));
  const [activeKey, setActiveKey] = useState<string | null>(null);
  // A monthly drill replaces keys with day keys; never display a stale point as
  // a fabricated zero after that transition.
  const activePoint = chart.points.find((point) => point.key === activeKey);
  const height = expanded ? "var(--group-spending-plot-height, 160px)" : compact ? 66 : 118;
  const axisMax = Math.max(chart.axisMaxCents, 1);
  const ticks = chart.points
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => point.label.length > 0);
  const lastYTickIndex = chart.yTicks.length - 1;
  const lastXTickIndex = ticks.length - 1;

  return (
    <div
      className={`soft-chart mt-3 grid ${compact ? "grid-cols-[32px_minmax(0,1fr)] gap-2" : "grid-cols-[44px_minmax(0,1fr)] gap-3"}`}
    >
      <div className="relative" style={{ height }}>
        {chart.yTicks.map((tick, index) => {
          const top = (1 - tick.value / axisMax) * 100;
          const align =
            index === 0
              ? "-translate-y-full"
              : index === lastYTickIndex
                ? "translate-y-0"
                : "-translate-y-1/2";
          return (
            <span
              key={tick.value}
              className={`absolute right-0 font-semibold text-muted ${
                expanded ? "text-meta" : compact ? "text-[8.5px]" : "text-[10px]"
              } ${align}`}
              style={{ top: `${top}%` }}
            >
              {tick.label}
            </span>
          );
        })}
      </div>

      <div>
        <div className="relative" style={{ height }}>
          {chart.yTicks.map((tick) => (
            <span
              key={tick.value}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 right-0 border-t border-edge"
              style={{ top: `${(1 - tick.value / axisMax) * 100}%` }}
            />
          ))}

          <div
            className={`absolute inset-0 flex items-end ${
              chart.granularity === "day"
                ? compact
                  ? "gap-1"
                  : "gap-1.5"
                : compact
                  ? "gap-2"
                  : "gap-4"
            }`}
          >
            {chart.points.map((point, index) => {
              const barPct =
                point.spentCents > 0
                  ? Math.max(4, (point.spentCents / axisMax) * 100)
                  : compact
                    ? 3
                    : 4;
              const detailLabel =
                chart.granularity === "day"
                  ? `${t("dayN", { n: index + 1 })} · ${formatMoney(point.spentCents)}`
                  : `${point.label} · ${formatMoney(point.spentCents)}`;
              const tooltipAlign =
                index === 0 ? "start" : index === chart.points.length - 1 ? "end" : "center";

              return (
                <button
                  key={point.key}
                  type="button"
                  aria-label={
                    expanded
                      ? `${dateLabel(point.key)} · ${fmt.money(point.spentCents)}${futureKeys.includes(point.key) ? ` · ${group("futureMark")}` : ""}`
                      : detailLabel
                  }
                  aria-pressed={expanded ? activePoint?.key === point.key : undefined}
                  onClick={() => {
                    if (chart.granularity === "month") onSelectMonth(point.key);
                    else
                      setActiveKey((current) =>
                        expanded ? point.key : current === point.key ? null : point.key,
                      );
                  }}
                  onMouseEnter={() => setActiveKey(point.key)}
                  onMouseLeave={() => {
                    if (!expanded)
                      setActiveKey((current) => (current === point.key ? null : current));
                  }}
                  onFocus={() => setActiveKey(point.key)}
                  onBlur={() => {
                    if (!expanded)
                      setActiveKey((current) => (current === point.key ? null : current));
                  }}
                  className="relative flex h-full min-w-0 flex-1 items-end outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                >
                  {activeKey === point.key && !expanded && (
                    <div
                      className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2"
                      style={{ bottom: `${barPct}%` }}
                    >
                      <div className="relative">
                        <ChartTooltip label={detailLabel} align={tooltipAlign} />
                      </div>
                    </div>
                  )}
                  <span
                    data-future={(expanded && futureKeys.includes(point.key)) || undefined}
                    data-selected={(expanded && activePoint?.key === point.key) || undefined}
                    className={`${expanded ? "group-spending-bar " : ""}block w-full rounded-t-[6px] bg-primary transition-opacity ${
                      point.key === chart.currentKey ? "" : "opacity-[.26] hover:opacity-50"
                    }`}
                    style={{ height: `${barPct}%` }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative mt-2 h-4">
          {ticks.map(({ point, index }, tickIndex) => {
            const left = ((index + 0.5) / chart.points.length) * 100;
            const align =
              tickIndex === 0
                ? "translate-x-0"
                : tickIndex === lastXTickIndex
                  ? "-translate-x-full"
                  : "-translate-x-1/2";
            const label =
              chart.granularity === "day" && tickIndex === 0
                ? t("dayN", { n: Number(point.label) })
                : point.label;
            return (
              <span
                key={point.key}
                className={`absolute whitespace-nowrap font-semibold text-muted ${
                  expanded ? "text-meta" : compact ? "text-[8.5px]" : "text-[10px]"
                } ${align}`}
                style={{ left: `${left}%` }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
      {expanded && (
        <div
          role="status"
          aria-live="polite"
          className="col-span-2 mt-2 min-h-11 rounded-[8px] bg-track px-3 py-2 text-meta text-ink"
        >
          {activePoint ? (
            <>
              <span>{dateLabel(activePoint.key)}</span>
              <strong className="ml-2 font-semibold tabular-nums">
                {fmt.money(activePoint.spentCents)}
              </strong>
              {futureKeys.includes(activePoint.key) && (
                <span className="mt-1 block text-muted">{group("futureMark")}</span>
              )}
            </>
          ) : (
            group("tapBar")
          )}
        </div>
      )}
    </div>
  );
}
