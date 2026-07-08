"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { formatMoney } from "@/lib/format";
import {
  activeTrendKey,
  categoryBreakdown,
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

  // Selection lives in the store so the header period pill matches the chart.
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
  // Habit merchants are a rolling last-30-days panel, independent of the
  // selected month on the chart.
  const merchants = topRecurringMerchants(transactions, 5);
  const breakdown = active ? categoryBreakdown(transactions, active.key).slice(0, 6) : [];
  const spentCents = active?.spentCents ?? 0;
  const incomeCents = active?.incomeCents ?? 0;
  const netCents = incomeCents - spentCents;
  const ivsMax = Math.max(incomeCents, spentCents, 1);

  // Hover state for the inline trend bars (tooltip + dimming siblings).
  const [hovered, setHovered] = useState<number | null>(null);

  // Trends needs history to say anything — show a dedicated empty state (a flat
  // placeholder chart + a prompt to import past data) until transactions exist.
  if (transactions.length === 0) {
    const now = new Date();
    const emptyLabels = Array.from({ length: 6 }, (_, i) =>
      new Date(now.getFullYear(), now.getMonth() - 5 + i, 1).toLocaleDateString("en-US", {
        month: "short",
      }),
    );
    return (
      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-4">
        <div className="rounded-[14px] border border-edge p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[14px] font-bold text-ink">Spending, last 6 months</div>
              <div className="mt-0.5 text-[12px] font-medium text-muted">
                No data for this period yet
              </div>
            </div>
            <div className="text-[24px] font-bold tracking-tight tabular-nums text-ink">
              {formatMoney(0)}
            </div>
          </div>
          <div className="mt-[18px] flex h-[150px] items-end gap-[14px]">
            {emptyLabels.map((label) => (
              <div key={label} className="flex h-full flex-1 flex-col justify-end gap-2">
                <div className="h-1 rounded-[6px] bg-track" />
                <span className="text-center text-[10.5px] font-semibold text-muted">{label}</span>
              </div>
            ))}
          </div>
        </div>
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
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Spending, last 6 months */}
      <div className="rounded-[14px] border border-edge p-[16px_18px]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[14px] font-bold text-ink">Spending, last 6 months</div>
            <div className="mt-0.5 text-[12px] font-medium text-muted">
              Showing {active?.label ?? "—"} · click a bar for another month
            </div>
          </div>
          <div className="text-[24px] font-bold tracking-tight tabular-nums text-ink">
            {formatMoney(spentCents)}
            {changePct !== null && (
              <span
                className={`ml-1 inline-flex items-center gap-0.5 text-[13px] font-semibold ${
                  changePct <= 0 ? "text-green" : "text-primary"
                }`}
              >
                {changePct <= 0 ? (
                  <ArrowDown size={14} strokeWidth={2} />
                ) : (
                  <ArrowUp size={14} strokeWidth={2} />
                )}
                {Math.abs(changePct)}%
              </span>
            )}
          </div>
        </div>

        {/* Simple flex bars — current month solid, others muted. */}
        <div className="mt-[18px] flex h-[150px] items-end gap-[14px]">
          {points.map((point, i) => (
            <div
              key={point.label}
              className="flex h-full flex-1 flex-col justify-end gap-2"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
            >
              <div className="relative w-full" style={{ height: `${point.heightPercent}%` }}>
                {tooltips?.[i] && hovered === i && (
                  <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-semibold text-bg shadow-lg">
                    {tooltips[i]}
                  </div>
                )}
                <button
                  type="button"
                  aria-label={tooltips?.[i] ?? point.label}
                  onClick={() => set({ trendMonthKey: months[i].key })}
                  className={`h-full min-h-[6px] w-full rounded-[6px] bg-primary outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-primary/60 ${
                    point.current ? "opacity-100" : "opacity-[.26] hover:opacity-50"
                  }`}
                />
              </div>
              <span
                className={`text-center text-[10.5px] font-semibold ${
                  point.current ? "text-primary" : "text-muted"
                }`}
              >
                {point.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Income vs spending */}
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="text-[13.5px] font-bold text-ink">
            Income vs spending
            <span className="ml-1 font-medium text-muted">· {active?.label ?? "—"}</span>
          </div>
          <div className="mt-[14px] flex h-[120px] items-end justify-center gap-10">
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div
                className="w-[56px] rounded-[6px] bg-green"
                style={{ height: `${Math.max(4, (incomeCents / ivsMax) * 100)}%` }}
              />
              <span className="text-[11px] font-semibold text-green">
                {formatMoney(incomeCents)}
              </span>
            </div>
            <div className="flex h-full flex-col items-center justify-end gap-2">
              <div
                className="w-[56px] rounded-[6px] bg-primary"
                style={{ height: `${Math.max(4, (spentCents / ivsMax) * 100)}%` }}
              />
              <span className="text-[11px] font-semibold text-primary">
                {formatMoney(spentCents)}
              </span>
            </div>
          </div>
        </div>

        {/* Top movers */}
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="text-[13.5px] font-bold text-ink">
            Top movers
            <span className="ml-1 font-medium text-muted">· vs {previous?.label ?? "—"}</span>
          </div>
          {movers.length === 0 && (
            <div className="mt-3 text-[13px] font-medium text-muted">
              No prior month to compare against.
            </div>
          )}
          {movers.map((mover) => (
            <div key={mover.name} className="mt-[11px] flex items-center justify-between">
              <span className="text-[13px] font-semibold text-ink">
                {mover.emoji} {mover.name}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[13px] font-semibold ${
                  mover.deltaCents > 0 ? "text-primary" : "text-green"
                }`}
              >
                {mover.deltaCents > 0 ? (
                  <ArrowUp size={14} strokeWidth={2} />
                ) : (
                  <ArrowDown size={14} strokeWidth={2} />
                )}
                {formatMoney(Math.abs(mover.deltaCents))}
              </span>
            </div>
          ))}
          <div className="mt-[13px] flex items-center justify-between border-t border-edge pt-[12px]">
            <span className="text-[13px] font-bold text-ink">Net · {active?.label ?? "—"}</span>
            <span className="text-[14px] font-bold tabular-nums text-primary">
              {formatMoney(netCents, { signed: true })}
            </span>
          </div>
        </div>

        {/* Month breakdown */}
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="text-[13.5px] font-bold text-ink">
            {active?.label ?? "—"} breakdown
            <span className="ml-1 font-medium text-muted">· where the money went</span>
          </div>
          {breakdown.length === 0 ? (
            <div className="mt-3 text-[13px] font-medium text-muted">No spending this month.</div>
          ) : (
            <div>
              {breakdown.map((cat) => (
                <div key={cat.name} className="mt-3">
                  <div className="flex justify-between text-[12.5px] font-semibold text-ink">
                    <span>
                      {cat.emoji} {cat.name}
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(cat.cents)}
                      <span className="ml-1 font-medium text-muted">
                        {Math.round((cat.cents / spentCents) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(2, (cat.cents / spentCents) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Frequent spots */}
        <div className="rounded-[14px] border border-edge p-[16px_18px]">
          <div className="text-[13.5px] font-bold text-ink">Frequent spots</div>
          <div className="mt-0.5 text-[11px] font-medium text-muted">
            Merchants you keep coming back to · last 30 days
          </div>
          {merchants.length === 0 ? (
            <div className="mt-3 text-[13px] font-medium text-muted">
              No repeat visits in the last 30 days.
            </div>
          ) : (
            <div>
              {merchants.map((m) => (
                <div key={m.name} className="mt-[13px] flex items-center justify-between">
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                    {m.emoji} {m.name}
                    <span className="ml-1 font-medium text-muted">· {formatMoney(m.cents)}</span>
                  </span>
                  <span className="ml-2 text-[12px] font-semibold tabular-nums text-primary">
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
