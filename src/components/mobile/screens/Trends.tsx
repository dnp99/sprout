"use client";

import { useMemo } from "react";
import { BarChart } from "@/components/ui/BarChart";
import { StatCard } from "@/components/ui/StatCard";
import { formatMoney } from "@/lib/format";
import {
  activeTrendKey,
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
  // Rolling last-30-days habit panel, independent of the selected month.
  const merchants = topRecurringMerchants(transactions, 5);

  const spentCents = active?.spentCents ?? 0;
  const incomeCents = active?.incomeCents ?? 0;
  const netCents = incomeCents - spentCents;

  return (
    <div className="px-[22px] pt-3">
      <h1 className="text-[22px] font-extrabold text-ink">Trends 📈</h1>

      <div className="mt-4 rounded-card bg-card p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-[12.5px] font-bold text-muted">
            Spending · {active?.label ?? "—"}
          </span>
          <span className="text-[11px] font-bold text-subtle">tap a bar</span>
        </div>
        <div className="mt-0.5 text-[28px] font-extrabold tabular-nums text-ink">
          {formatMoney(spentCents)}{" "}
          {changePct !== null && (
            <span
              className="text-xs font-bold"
              style={{ color: changePct <= 0 ? "#4f7a3a" : "#c25b3a" }}
            >
              {changePct <= 0 ? "↓" : "↑"} {Math.abs(changePct)}%
            </span>
          )}
        </div>
        <div className="mt-4">
          <BarChart
            points={points}
            tooltips={tooltips}
            onSelect={(i) => set({ trendMonthKey: months[i].key })}
          />
        </div>
      </div>

      <div className="mt-3.5 flex gap-3">
        <StatCard
          label="Income"
          value={formatMoney(incomeCents)}
          variant="income"
          className="flex-1"
        />
        <StatCard
          label="Net"
          value={formatMoney(netCents, { signed: true })}
          valueClassName={netCents >= 0 ? "text-green" : "text-primary-dark"}
          className="flex-1"
        />
      </div>

      {movers.length > 0 && (
        <div className="mt-3.5 rounded-card bg-card p-5">
          <div className="mb-3 text-[12.5px] font-bold text-muted">
            Top movers · vs {previous?.label ?? "—"}
          </div>
          <div className="flex flex-col gap-3 text-sm">
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
        </div>
      )}

      {merchants.length > 0 && (
        <div className="mt-3.5 rounded-card bg-card p-5">
          <div className="mb-3 text-[12.5px] font-bold text-muted">
            Frequent spots · last 30 days
          </div>
          <div className="flex flex-col gap-3 text-sm">
            {merchants.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="min-w-0 flex-1 truncate font-bold">
                  {m.emoji} {m.name}
                  <span className="ml-1 font-semibold text-muted">· {formatMoney(m.cents)}</span>
                </span>
                <span className="ml-2 font-extrabold tabular-nums text-primary">
                  {m.count}× visits
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
