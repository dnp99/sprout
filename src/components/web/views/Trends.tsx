"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { ChartTooltip } from "@/components/ui/ChartTooltip";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { CashFlow } from "./CashFlow";
import { formatMoney } from "@/lib/format";
import { buildTrendsReport } from "@/lib/reports";
import { latestMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Trends() {
  const { transactions, trendPeriod, trendMonthKey, trendView, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      trendPeriod: s.trendPeriod,
      trendMonthKey: s.trendMonthKey,
      trendView: s.trendView,
      set: s.set,
    })),
  );
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // The "month" period can be drilled into a specific month (by clicking a bar);
  // every other period anchors to the latest month with data.
  const report = useMemo(() => {
    const anchor = trendPeriod === "month" && trendMonthKey ? trendMonthKey : undefined;
    return buildTrendsReport(transactions, trendPeriod, anchor);
  }, [transactions, trendPeriod, trendMonthKey]);

  if (transactions.length === 0) {
    return (
      <DesktopEmpty
        icon={TrendingUp}
        title="Not enough data yet"
        description="Track your spending for a month or two and your trends & reports will appear here."
      >
        <button
          type="button"
          onClick={() => set({ webView: "import" })}
          className="rounded-[10px] border border-edge px-5 py-[11px] text-[13px] font-semibold"
        >
          Import past transactions
        </button>
      </DesktopEmpty>
    );
  }

  const { chart } = report;
  const maxSpent = Math.max(1, ...chart.months.map((m) => m.spentCents));
  const chartLabel =
    report.period === "ytd"
      ? "year to date"
      : `last ${chart.months.length} month${chart.months.length === 1 ? "" : "s"}`;
  const drillMonth = (key: string) => set({ trendPeriod: "month", trendMonthKey: key });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Cash flow ⇄ Spending mode toggle (plan 012). */}
      <div className="mt-4 flex w-fit items-center gap-1 rounded-[12px] border border-edge bg-card p-1">
        {(["cashflow", "spending"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => set({ trendView: v })}
            className={`rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              trendView === v ? "bg-primary text-onprimary" : "text-muted hover:text-ink"
            }`}
          >
            {v === "cashflow" ? "Cash flow" : "Spending"}
          </button>
        ))}
      </div>

      {trendView === "cashflow" ? (
        <CashFlow transactions={transactions} />
      ) : (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-[13px]">
            <Stat
              label="Total income"
              value={formatMoney(report.incomeCents)}
              sub={report.rangeLabel}
              tone="pos"
            />
            <Stat
              label="Total spending"
              value={formatMoney(report.spendingCents)}
              sub={report.rangeLabel}
            />
            <Stat
              label="Net"
              value={formatMoney(report.netCents, { signed: true })}
              sub="Saved this period"
              tone="primary"
            />
            <Stat
              label="Transactions"
              value={report.txnCount.toLocaleString()}
              sub={`Across ${report.monthsInWindow} month${report.monthsInWindow === 1 ? "" : "s"}`}
            />
          </div>

          {/* Spending chart */}
          <div className="mt-[14px] rounded-[14px] border border-edge p-[18px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[14px] font-bold">Spending · {chartLabel}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  Click a bar to drill into a month
                </div>
              </div>
              <div className="text-[22px] font-bold tracking-[-0.02em] tabular-nums">
                {formatMoney(chart.totalCents)}
                {chart.changePct !== null && (
                  <span
                    className={`ml-1 inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${chart.changePct <= 0 ? "text-green" : "text-primary"}`}
                  >
                    {chart.changePct <= 0 ? (
                      <ArrowDown size={13} strokeWidth={2.5} />
                    ) : (
                      <ArrowUp size={13} strokeWidth={2.5} />
                    )}
                    {Math.abs(chart.changePct)}%
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex h-[118px] items-end gap-4">
              {chart.months.map((m, i) => (
                <div
                  key={m.key}
                  className="flex h-full flex-1 flex-col justify-end gap-[7px]"
                  onMouseEnter={() => setHoveredBar(i)}
                  onMouseLeave={() => setHoveredBar((h) => (h === i ? null : h))}
                >
                  {/* The bar is the tooltip's positioning context, so the tooltip
                  sits a fixed gap above the *bar top*, not the column top. */}
                  <div
                    className="relative w-full"
                    style={{
                      height: `${Math.max(4, Math.round((m.spentCents / maxSpent) * 100))}%`,
                    }}
                  >
                    {hoveredBar === i && (
                      <ChartTooltip label={`${m.label} · ${formatMoney(m.spentCents)}`} />
                    )}
                    <button
                      type="button"
                      aria-label={`${m.label} · ${formatMoney(m.spentCents)}`}
                      onClick={() => drillMonth(m.key)}
                      className={`h-full w-full rounded-[7px] bg-primary outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-primary/60 ${m.key === chart.currentKey ? "" : "opacity-[.26] hover:opacity-50"}`}
                    />
                  </div>
                  <span
                    className={`text-center text-[10px] font-semibold ${m.key === chart.currentKey ? "text-primary" : "text-muted"}`}
                  >
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* By category + frequent spots / top movers */}
          <div className="mt-[14px] grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-[14px]">
            <div className="overflow-hidden rounded-[14px] border border-edge p-[16px_18px]">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold">By category</span>
                <span className="text-[11px] text-muted">{report.rangeLabel}</span>
              </div>
              {report.byCategory.length === 0 ? (
                <div className="mt-3 text-[12.5px] text-muted">No spending in this period.</div>
              ) : (
                report.byCategory.slice(0, 5).map((c) => (
                  <div key={c.name} className="mt-[11px]">
                    <div className="flex justify-between text-[12.5px] font-semibold">
                      <span>{c.name}</span>
                      <span className="tabular-nums">
                        {formatMoney(c.cents)}
                        <span className="ml-1 font-medium text-muted">{Math.round(c.pct)}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-track">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex min-h-0 flex-col gap-[14px]">
              <div className="rounded-[14px] border border-edge p-[15px_16px]">
                <div className="text-[13.5px] font-bold">Frequent spots</div>
                <div className="mt-px text-[10.5px] text-muted">Most visits this period</div>
                {report.frequentSpots.slice(0, 3).map((m) => (
                  <div key={m.name} className="mt-2.5 flex items-center justify-between">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                      {m.name}{" "}
                      <span className="font-normal text-muted">· {formatMoney(m.cents)}</span>
                    </span>
                    <span className="ml-2 text-[11.5px] font-semibold text-primary">
                      {m.count} visit{m.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="min-h-0 flex-1 rounded-[14px] border border-edge p-[15px_16px]">
                <div className="text-[13.5px] font-bold">Top movers</div>
                <div className="mt-px text-[10.5px] text-muted">
                  vs previous {report.periodLabel.toLowerCase()}
                </div>
                {report.topMovers.length === 0 ? (
                  <div className="mt-2.5 text-[12.5px] text-muted">No change to report.</div>
                ) : (
                  report.topMovers.slice(0, 3).map((m) => (
                    <div key={m.name} className="mt-2.5 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold">{m.name}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${m.deltaCents < 0 ? "text-green" : "text-primary"}`}
                      >
                        {m.deltaCents < 0 ? (
                          <ArrowDown size={13} strokeWidth={2.5} />
                        ) : (
                          <ArrowUp size={13} strokeWidth={2.5} />
                        )}
                        {formatMoney(Math.abs(m.deltaCents))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One summary tile — `pos` colors the value green, `primary` terracotta. */
function Stat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "pos" | "primary";
}) {
  return (
    <div className="rounded-[14px] border border-edge p-[13px_15px]">
      <div className="text-[10px] font-bold uppercase tracking-[.05em] text-muted">{label}</div>
      <div
        className={`mt-1 text-[22px] font-bold tracking-[-0.02em] tabular-nums ${tone === "pos" ? "text-green" : tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </div>
      <div className="mt-px text-[10.5px] text-muted">{sub}</div>
    </div>
  );
}
