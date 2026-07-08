"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/ui/BarChart";
import { formatMoney } from "@/lib/format";
import {
  activeTrendKey,
  categoryBreakdown,
  monthlyTrend,
  spendChangePercent,
  toTrendPoints,
  topRecurringMerchants,
  topMovers,
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

  // Selection lives in the store so the header period pill matches the chart.
  const activeKey = activeTrendKey(months, trendMonthKey);
  const activeIndex = months.findIndex((m) => m.key === activeKey);
  const active = months[activeIndex];
  const previous = activeIndex > 0 ? months[activeIndex - 1] : undefined;

  const points = toTrendPoints(months, activeKey);
  const tooltips = months.map((m) => `${m.label} · ${formatMoney(m.spentCents)}`);
  const changePct = previous
    ? spendChangePercent(active?.spentCents ?? 0, previous.spentCents)
    : null;

  const movers = previous ? topMovers(transactions, activeKey, previous.key) : [];
  // Habit merchants are a rolling last-30-days panel, independent of the
  // selected month on the chart.
  const merchants = topRecurringMerchants(transactions, 5);
  const breakdown = active ? categoryBreakdown(transactions, active.key).slice(0, 6) : [];
  const spentCents = active?.spentCents ?? 0;
  const incomeCents = active?.incomeCents ?? 0;
  const netCents = incomeCents - spentCents;
  const ivsMax = Math.max(incomeCents, spentCents, 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[20px] bg-card p-6">
        <div className="flex justify-between">
          <div>
            <span className="text-[15px] font-extrabold text-ink">Spending, last 6 months</span>
            <div className="mt-0.5 text-xs font-semibold text-muted">
              Showing {active?.label ?? "—"} · click a bar for another month
            </div>
          </div>
          <span className="text-[22px] font-extrabold tabular-nums text-ink">
            {formatMoney(spentCents)}
            {changePct !== null && (
              <span
                className="ml-1 text-[13px]"
                style={{ color: changePct <= 0 ? "#4f7a3a" : "#c25b3a" }}
              >
                {changePct <= 0 ? "↓" : "↑"} {Math.abs(changePct)}%
              </span>
            )}
          </span>
        </div>
        <div className="mt-5">
          <BarChart
            points={points}
            height={190}
            tooltips={tooltips}
            onSelect={(i) => set({ trendMonthKey: months[i].key })}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-sm font-extrabold text-ink">
            Income vs spending
            <span className="ml-1 font-semibold text-muted">· {active?.label ?? "—"}</span>
          </div>
          <div className="flex h-[150px] items-end justify-center gap-8">
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div
                className="w-[70px] rounded-[10px] bg-green"
                style={{ height: `${Math.max(4, (incomeCents / ivsMax) * 100)}%` }}
              />
              <span className="text-xs font-extrabold text-[#4f7a3a]">
                Income {formatMoney(incomeCents)}
              </span>
            </div>
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div
                className="w-[70px] rounded-[10px] bg-primary"
                style={{ height: `${Math.max(4, (spentCents / ivsMax) * 100)}%` }}
              />
              <span className="text-xs font-extrabold text-primary-dark">
                Spent {formatMoney(spentCents)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-sm font-extrabold text-ink">
            Top movers
            <span className="ml-1 font-semibold text-muted">· vs {previous?.label ?? "—"}</span>
          </div>
          <div className="flex flex-col gap-4 text-sm">
            {movers.length === 0 && (
              <div className="text-[13px] font-semibold text-muted">
                No prior month to compare against.
              </div>
            )}
            {movers.map((mover) => (
              <div key={mover.name} className="flex justify-between">
                <span className="font-bold">
                  {mover.emoji} {mover.name}
                </span>
                <span
                  className="font-extrabold"
                  style={{ color: mover.deltaCents > 0 ? "#c25b3a" : "#4f7a3a" }}
                >
                  {mover.deltaCents > 0 ? "↑" : "↓"} {formatMoney(Math.abs(mover.deltaCents))}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-track pt-4 text-sm">
            <span className="font-extrabold">Net · {active?.label ?? "—"}</span>
            <span className="font-extrabold tabular-nums">
              {formatMoney(netCents, { signed: true })}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-4 text-sm font-extrabold text-ink">
            {active?.label ?? "—"} breakdown
            <span className="ml-1 font-semibold text-muted">· where the money went</span>
          </div>
          {breakdown.length === 0 ? (
            <div className="text-[13px] font-semibold text-muted">No spending this month.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {breakdown.map((cat) => (
                <div key={cat.name}>
                  <div className="flex justify-between text-[13.5px]">
                    <span className="font-bold text-ink">
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="font-extrabold tabular-nums text-ink">
                      {formatMoney(cat.cents)}
                      <span className="ml-1 font-semibold text-muted">
                        {Math.round((cat.cents / spentCents) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-track">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${Math.max(2, (cat.cents / spentCents) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 rounded-[20px] bg-card p-6">
          <div className="mb-1 text-sm font-extrabold text-ink">
            Frequent spots
            <span className="ml-1 font-semibold text-muted">· last 30 days</span>
          </div>
          <div className="mb-4 text-[12px] font-semibold text-muted">
            Merchants you keep coming back to
          </div>
          {merchants.length === 0 ? (
            <div className="text-[13px] font-semibold text-muted">
              No repeat visits in the last 30 days.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {merchants.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-[13.5px]">
                  <span className="min-w-0 flex-1 truncate font-bold text-ink">
                    {m.emoji} {m.name}
                    <span className="ml-1 font-semibold text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 font-extrabold tabular-nums text-primary">
                    {m.count}× visits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
