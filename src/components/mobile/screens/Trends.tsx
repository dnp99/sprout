"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { TrendPeriodToggle } from "@/components/shared/TrendPeriodToggle";
import { formatMoney } from "@/lib/format";
import { buildTrendsReport } from "@/lib/reports";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Trends() {
  const { transactions, trendPeriod, trendMonthKey, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      trendPeriod: s.trendPeriod,
      trendMonthKey: s.trendMonthKey,
      set: s.set,
    })),
  );

  const report = useMemo(() => {
    const anchor = trendPeriod === "month" && trendMonthKey ? trendMonthKey : undefined;
    return buildTrendsReport(transactions, trendPeriod, anchor);
  }, [transactions, trendPeriod, trendMonthKey]);

  const { chart } = report;
  const maxSpent = Math.max(1, ...chart.months.map((m) => m.spentCents));
  const activeMonth = chart.months.find((m) => m.key === chart.currentKey) ?? chart.months.at(-1);
  const activeMonthIndex = activeMonth
    ? chart.months.findIndex((m) => m.key === activeMonth.key)
    : -1;
  const activeTooltipLeft =
    activeMonthIndex >= 0 && chart.months.length > 0
      ? `${((activeMonthIndex + 0.5) / chart.months.length) * 100}%`
      : "50%";
  const chartLabel =
    report.period === "month"
      ? report.rangeLabel
      : report.period === "ytd"
        ? "year to date"
        : `last ${chart.months.length} months`;
  const chartHint = report.period === "month" ? "selected month" : "tap a bar";
  const drillMonth = (key: string) => set({ trendPeriod: "month", trendMonthKey: key });

  return (
    <div className="px-4 pt-3">
      {/* Period toggle lives here (full width) rather than in the header. */}
      <TrendPeriodToggle
        compact
        period={trendPeriod}
        onChange={(p) => set({ trendPeriod: p, trendMonthKey: "" })}
      />

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center px-6 pb-4 pt-14 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <TrendingUp size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">Not enough data yet</div>
          <div className="mt-[5px] text-[12px] font-medium leading-[1.5] text-muted">
            Track spending for a month or two and your trends will appear here.
          </div>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="mt-[11px] grid grid-cols-2 gap-2">
            <MStat label="Income" value={formatMoney(report.incomeCents)} tone="pos" filled />
            <MStat label="Spending" value={formatMoney(report.spendingCents)} />
            <MStat
              label="Net"
              value={formatMoney(report.netCents, { signed: true })}
              tone="primary"
            />
            <MStat label="Transactions" value={report.txnCount.toLocaleString()} />
          </div>

          {/* Spending chart */}
          <div className="mt-[11px] rounded-[10px] border border-edge p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11.5px] font-medium text-muted">Spending · {chartLabel}</span>
              <span className="text-[10.5px] font-medium text-muted">{chartHint}</span>
            </div>
            <div className="mt-[3px] flex items-baseline gap-2">
              <span className="text-[22px] font-bold tracking-[-.02em] tabular-nums text-ink">
                {formatMoney(chart.totalCents)}
              </span>
              {chart.changePct !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 text-[11.5px] font-semibold ${chart.changePct <= 0 ? "text-green" : "text-primary"}`}
                >
                  {chart.changePct <= 0 ? (
                    <ArrowDown size={12} strokeWidth={2.5} />
                  ) : (
                    <ArrowUp size={12} strokeWidth={2.5} />
                  )}
                  {Math.abs(chart.changePct)}%
                </span>
              )}
            </div>
            <div className="relative mt-3 pt-9">
              {activeMonth && (
                <div
                  className="absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-[8px] border border-edge bg-card px-2.5 py-1.5 text-center shadow-lg"
                  style={{ left: activeTooltipLeft }}
                >
                  <div className="text-[9.5px] font-semibold text-muted">{activeMonth.label}</div>
                  <div className="text-[11px] font-bold tabular-nums text-ink">
                    {formatMoney(activeMonth.spentCents)}
                  </div>
                </div>
              )}
              <div className="flex h-[66px] items-end gap-2">
                {chart.months.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-label={`${m.label} · ${formatMoney(m.spentCents)}`}
                    onClick={() => drillMonth(m.key)}
                    className="flex h-full flex-1 flex-col justify-end"
                  >
                    <div
                      className={`rounded-[5px] bg-primary ${m.key === chart.currentKey ? "" : "opacity-[.26]"}`}
                      style={{
                        height: `${Math.max(4, Math.round((m.spentCents / maxSpent) * 100))}%`,
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              {chart.months.map((m) => (
                <span
                  key={m.key}
                  className={`flex-1 text-center text-[9.5px] font-semibold ${m.key === chart.currentKey ? "text-primary" : "text-muted"}`}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* By category */}
          {report.byCategory.length > 0 && (
            <div className="mt-[11px] rounded-[10px] border border-edge p-3">
              <div className="text-[11px] font-medium text-muted">
                By category · {report.rangeLabel}
              </div>
              {report.byCategory.slice(0, 4).map((c) => (
                <div key={c.name} className="mt-2.5">
                  <div className="flex justify-between text-[11.5px] font-semibold">
                    <span>{c.name}</span>
                    <span className="tabular-nums">
                      {formatMoney(c.cents)}{" "}
                      <span className="font-medium text-muted">{Math.round(c.pct)}%</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Frequent spots */}
          {report.frequentSpots.length > 0 && (
            <div className="mt-[11px] rounded-[10px] border border-edge p-3">
              <div className="text-[11px] font-medium text-muted">Frequent spots · most visits</div>
              <div className="mt-2 flex flex-col gap-2">
                {report.frequentSpots.slice(0, 3).map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
                      {m.name}
                      <span className="ml-1 font-medium text-muted">· {formatMoney(m.cents)}</span>
                    </span>
                    <span className="ml-2 text-[11.5px] font-semibold tabular-nums text-primary">
                      {m.count} visit{m.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top movers */}
          {report.topMovers.length > 0 && (
            <div className="mt-[11px] rounded-[10px] border border-edge p-3">
              <div className="text-[11px] font-medium text-muted">
                Top movers · vs previous {report.periodLabel.toLowerCase()}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                {report.topMovers.slice(0, 3).map((m) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="text-[12.5px] font-semibold text-ink">{m.name}</span>
                    <span
                      className={`inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${m.deltaCents < 0 ? "text-green" : "text-primary"}`}
                    >
                      {m.deltaCents < 0 ? (
                        <ArrowDown size={12} strokeWidth={2.5} />
                      ) : (
                        <ArrowUp size={12} strokeWidth={2.5} />
                      )}
                      {formatMoney(Math.abs(m.deltaCents))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Mobile summary tile — `filled` uses a green tint (income); `tone` colors the value. */
function MStat({
  label,
  value,
  tone,
  filled,
}: {
  label: string;
  value: string;
  tone?: "pos" | "primary";
  filled?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] p-[10px_11px] ${filled ? "bg-green/[.13]" : "border border-edge"}`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[.04em] text-muted">{label}</div>
      <div
        className={`mt-0.5 text-[15px] font-bold tracking-[-.02em] tabular-nums ${tone === "pos" ? "text-green" : tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
