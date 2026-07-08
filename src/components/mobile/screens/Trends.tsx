"use client";

import { useMemo } from "react";
import { ChevronLeft, TrendingUp } from "lucide-react";
import { BarChart } from "@/components/ui/BarChart";
import { formatMoney } from "@/lib/format";
import {
  activeTrendKey,
  monthlyTrend,
  spendChangePercent,
  toTrendPoints,
  topRecurringMerchants,
  topMovers,
  trendTooltips,
} from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function Trends() {
  const { transactions, trendMonthKey, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      trendMonthKey: s.trendMonthKey,
      set: s.set,
    })),
  );

  const months = useMemo(() => monthlyTrend(transactions), [transactions]);
  const activeKey = activeTrendKey(months, trendMonthKey);
  const activeIndex = months.findIndex((m) => m.key === activeKey);
  const active = months[activeIndex];
  const previous = activeIndex > 0 ? months[activeIndex - 1] : undefined;

  const points = toTrendPoints(months, activeKey);
  const tooltips = trendTooltips(months);
  const changePct = previous
    ? spendChangePercent(active?.spentCents ?? 0, previous.spentCents)
    : null;
  const movers = previous ? topMovers(transactions, activeKey, previous.key) : [];
  // Rolling last-30-days habit panel, independent of the selected month.
  const merchants = topRecurringMerchants(transactions, 5);

  const spentCents = active?.spentCents ?? 0;
  const incomeCents = active?.incomeCents ?? 0;
  const netCents = incomeCents - spentCents;

  // Empty state mirrors the design's "not enough data yet" body: a static
  // muted chart placeholder sits above a centered icon tile and copy.
  const hasData = movers.length > 0 || merchants.length > 0;

  return (
    <div className="px-4 pt-1">
      <div className="flex items-center gap-2">
        <ChevronLeft size={18} strokeWidth={2} className="text-muted" />
        <h1 className="text-[20px] font-bold tracking-[-.02em] text-ink">Trends</h1>
      </div>

      <div className="mt-3 rounded-[10px] border border-edge p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] font-medium text-muted">
            Spending · {active?.label ?? "—"}
          </span>
          <span className="text-[10.5px] font-medium text-muted">tap a bar</span>
        </div>
        <div className="mt-[3px] flex items-baseline gap-2">
          <span className="text-[24px] font-bold tracking-[-.02em] tabular-nums text-ink">
            {formatMoney(spentCents)}
          </span>
          {changePct !== null && (
            <span
              className={`text-[11.5px] font-semibold ${
                changePct <= 0 ? "text-green" : "text-primary"
              }`}
            >
              {changePct <= 0 ? "↓" : "↑"} {Math.abs(changePct)}%
            </span>
          )}
        </div>
        <div className="mt-3">
          <BarChart
            points={points}
            height={94}
            tooltips={tooltips}
            onSelect={(i) => set({ trendMonthKey: months[i].key })}
          />
        </div>
      </div>

      <div className="mt-[11px] flex gap-2.5">
        <div className="flex-1 rounded-[10px] bg-track p-3">
          <div className="text-[9.5px] font-semibold uppercase tracking-[.04em] text-muted">
            Income
          </div>
          <div className="mt-0.5 text-[16px] font-bold tracking-[-.02em] tabular-nums text-green">
            {formatMoney(incomeCents)}
          </div>
        </div>
        <div className="flex-1 rounded-[10px] border border-edge p-3">
          <div className="text-[9.5px] font-semibold uppercase tracking-[.04em] text-muted">
            Net
          </div>
          <div
            className={`mt-0.5 text-[16px] font-bold tracking-[-.02em] tabular-nums ${
              netCents >= 0 ? "text-green" : "text-primary"
            }`}
          >
            {formatMoney(netCents, { signed: true })}
          </div>
        </div>
      </div>

      {movers.length > 0 && (
        <div className="mt-[11px] rounded-[10px] border border-edge p-3">
          <div className="text-[11px] font-medium text-muted">
            Top movers · vs {previous?.label ?? "—"}
          </div>
          <div className="mt-2 flex flex-col gap-2">
            {movers.map((mover) => (
              <div key={mover.name} className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-ink">
                  {mover.emoji} {mover.name}
                </span>
                <span
                  className={`text-[12.5px] font-semibold ${
                    mover.deltaCents > 0 ? "text-primary" : "text-green"
                  }`}
                >
                  {mover.deltaCents > 0 ? "↑" : "↓"} {formatMoney(Math.abs(mover.deltaCents))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {merchants.length > 0 && (
        <div className="mt-[11px] rounded-[10px] border border-edge p-3">
          <div className="text-[11px] font-medium text-muted">Frequent spots · last 30 days</div>
          <div className="mt-2 flex flex-col gap-2">
            {merchants.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink">
                  {m.emoji} {m.name}
                  <span className="ml-1 font-medium text-muted">· {formatMoney(m.cents)}</span>
                </span>
                <span className="ml-2 text-[11.5px] font-semibold tabular-nums text-primary">
                  {m.count} visits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasData && (
        <div className="flex flex-col items-center px-6 pb-4 pt-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <TrendingUp size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">Not enough data yet</div>
          <div className="mt-[5px] text-[12px] font-medium leading-[1.5] text-muted">
            Track spending for a month or two and your trends will appear here.
          </div>
        </div>
      )}
    </div>
  );
}
