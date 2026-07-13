"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { cashFlowSummary, incomeByCategory, monthlyCashFlow } from "@/lib/cash-flow";
import { periodMonthKeys } from "@/lib/reports";
import { categoryBreakdown, latestMonthKey, monthKeyLabel, type CategorySpend } from "@/lib/trends";
import type { Transaction } from "@/lib/types";

/** Cash-flow report (plan 012): income vs. expenses vs. net over a fixed
 *  6-month window, a savings-rate summary for the selected month, and income /
 *  expense category breakdowns. All figures come from the transaction-derived
 *  view-model (which drops budget-excluded rows), so it ties out to the budget. */
export function CashFlow({ transactions }: { transactions: Transaction[] }) {
  // Fixed 6-month window ending at the latest month with data (locked decision:
  // cash flow doesn't share the spending period control in v1).
  const keys = useMemo(() => periodMonthKeys("6m", latestMonthKey(transactions)), [transactions]);
  const series = useMemo(() => monthlyCashFlow(transactions, keys), [transactions, keys]);

  const latestKey = keys[keys.length - 1];
  const [picked, setPicked] = useState<string | null>(null);
  const selectedKey = picked && keys.includes(picked) ? picked : latestKey;
  const selected = series.find((m) => m.key === selectedKey) ?? series[series.length - 1];

  const summary = cashFlowSummary(selected);
  const incomeCats = useMemo(
    () => incomeByCategory(transactions, selectedKey),
    [transactions, selectedKey],
  );
  const expenseCats = useMemo(
    () => categoryBreakdown(transactions, selectedKey),
    [transactions, selectedKey],
  );

  // Bars scale to the largest single-side magnitude in the window.
  const maxMag = Math.max(1, ...series.map((m) => Math.max(m.incomeCents, m.expenseCents)));
  const half = (v: number) => `${Math.min(100, Math.round((v / maxMag) * 100))}%`;
  // Net line points in a 0–100 box where y=50 is $0 (net), y=0 is +maxMag.
  const netPoints = series
    .map((m, i) => {
      const x = series.length === 1 ? 50 : (i / (series.length - 1)) * 100;
      const y = 50 - (m.netCents / maxMag) * 50;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    })
    .join(" ");

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col">
      {/* Summary for the selected month */}
      <div className="grid grid-cols-4 gap-[13px]">
        <Stat
          label="Income"
          value={formatMoney(summary.incomeCents)}
          sub={monthKeyLabel(selectedKey)}
          tone="pos"
        />
        <Stat label="Expenses" value={formatMoney(summary.expenseCents)} sub="This month" />
        <Stat
          label="Total savings"
          value={formatMoney(summary.netCents, { signed: true })}
          sub={summary.netCents >= 0 ? "Saved" : "Overspent"}
          tone={summary.netCents >= 0 ? "pos" : "primary"}
        />
        <Stat
          label="Savings rate"
          value={summary.savingsRatePct === null ? "—" : `${summary.savingsRatePct}%`}
          sub="of income"
        />
      </div>

      {/* Income (up) / expense (down) chart with a net line */}
      <div className="mt-[14px] rounded-[14px] border border-edge p-[18px]">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold">Cash flow · last {series.length} months</div>
          <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green" /> Income
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> Expenses
            </span>
            <span className="flex items-center gap-1">
              <span className="h-[2px] w-3 bg-ink" /> Net
            </span>
          </div>
        </div>
        <div className="relative mt-4 h-[150px]">
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
          <div className="flex h-full items-stretch gap-3">
            {series.map((m) => {
              const isSel = m.key === selectedKey;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPicked(m.key)}
                  aria-label={`${monthKeyLabel(m.key)} · income ${formatMoney(m.incomeCents)} · expenses ${formatMoney(m.expenseCents)}`}
                  className="group flex flex-1 flex-col outline-none"
                >
                  <div className="flex flex-1 flex-col justify-end">
                    <div
                      className={`w-full rounded-t-[5px] bg-green transition-opacity ${isSel ? "" : "opacity-50 group-hover:opacity-80"}`}
                      style={{ height: half(m.incomeCents) }}
                    />
                  </div>
                  <div className="h-px w-full bg-edge" />
                  <div className="flex flex-1 flex-col justify-start">
                    <div
                      className={`w-full rounded-b-[5px] bg-primary transition-opacity ${isSel ? "" : "opacity-50 group-hover:opacity-80"}`}
                      style={{ height: half(m.expenseCents) }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 flex gap-3">
          {series.map((m) => (
            <span
              key={m.key}
              className={`flex-1 text-center text-[10px] font-semibold ${m.key === selectedKey ? "text-ink" : "text-muted"}`}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      {/* Income + expense category breakdowns for the selected month */}
      <div className="mt-[14px] grid min-h-0 flex-1 grid-cols-2 gap-[14px]">
        <Breakdown
          title="Income"
          rows={incomeCats}
          monthLabel={monthKeyLabel(selectedKey)}
          empty="No income this month."
        />
        <Breakdown
          title="Expenses"
          rows={expenseCats}
          monthLabel={monthKeyLabel(selectedKey)}
          empty="No spending this month."
        />
      </div>
    </div>
  );
}

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

function Breakdown({
  title,
  rows,
  monthLabel,
  empty,
}: {
  title: string;
  rows: CategorySpend[];
  monthLabel: string;
  empty: string;
}) {
  const total = rows.reduce((sum, r) => sum + r.cents, 0);
  return (
    <div className="overflow-hidden rounded-[14px] border border-edge p-[16px_18px]">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-bold">{title}</span>
        <span className="text-[11px] text-muted">{monthLabel}</span>
      </div>
      {rows.length === 0 ? (
        <div className="mt-3 text-[12.5px] text-muted">{empty}</div>
      ) : (
        rows.slice(0, 6).map((c) => {
          const pct = total > 0 ? Math.round((c.cents / total) * 100) : 0;
          return (
            <div key={c.name} className="mt-[11px]">
              <div className="flex justify-between text-[12.5px] font-semibold">
                <span className="min-w-0 truncate">
                  {c.emoji} {c.name}
                </span>
                <span className="tabular-nums">
                  {formatMoney(c.cents)}
                  <span className="ml-1 font-medium text-muted">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-track">
                <div
                  className={`h-full rounded-full ${title === "Income" ? "bg-green" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
