"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { monthKeyLabel, type CategorySpend } from "@/lib/trends";
import { useCashFlow } from "@/components/shared/useCashFlow";
import type { Transaction } from "@/lib/types";

/** Mobile cash-flow report (plan 012): the selected month's income / expenses /
 *  savings, a compact income-up/expense-down chart with a net line, and income /
 *  expense breakdowns. Shares its numbers with the web view via useCashFlow. */
export function CashFlow({ transactions }: { transactions: Transaction[] }) {
  const {
    series,
    selectedKey,
    summary,
    incomeCats,
    expenseCats,
    incomeMerchants,
    expenseMerchants,
    setPicked,
    stepMonth,
    canPrev,
    canNext,
  } = useCashFlow(transactions);

  const maxMag = Math.max(1, ...series.map((m) => Math.max(m.incomeCents, m.expenseCents)));
  const half = (v: number) => `${Math.min(100, Math.round((v / maxMag) * 100))}%`;
  const netPoints = series
    .map((m, i) => {
      const x = series.length === 1 ? 50 : (i / (series.length - 1)) * 100;
      const y = 50 - (m.netCents / maxMag) * 50;
      return `${x},${Math.max(0, Math.min(100, y))}`;
    })
    .join(" ");

  return (
    <>
      {/* Focused-month stepper — moves within the fixed 6-month window. */}
      <div className="mt-[11px] flex items-center gap-2">
        <MStepBtn dir="prev" disabled={!canPrev} onClick={() => stepMonth(-1)} />
        <span className="flex-1 text-center text-[13px] font-bold tabular-nums text-ink">
          {monthKeyLabel(selectedKey)}
        </span>
        <MStepBtn dir="next" disabled={!canNext} onClick={() => stepMonth(1)} />
      </div>

      <div className="mt-[11px] grid grid-cols-2 gap-2">
        <MStat label="Income" value={formatMoney(summary.incomeCents)} tone="pos" filled />
        <MStat label="Expenses" value={formatMoney(summary.expenseCents)} />
        <MStat
          label="Total savings"
          value={formatMoney(summary.netCents, { signed: true })}
          tone={summary.netCents >= 0 ? "pos" : "primary"}
        />
        <MStat
          label="Savings rate"
          value={summary.savingsRatePct === null ? "—" : `${summary.savingsRatePct}%`}
        />
      </div>

      {/* Income (up) / expense (down) chart with a net line */}
      <div className="mt-[11px] rounded-[10px] border border-edge p-3.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted">
          <span>Cash flow · last {series.length} months</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green" /> In
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Out
            </span>
          </span>
        </div>
        <div className="relative mt-3 h-[92px]">
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
          <div className="flex h-full items-stretch gap-2">
            {series.map((m) => {
              const isSel = m.key === selectedKey;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPicked(m.key)}
                  aria-label={`${monthKeyLabel(m.key)} · income ${formatMoney(m.incomeCents)} · expenses ${formatMoney(m.expenseCents)}`}
                  className={`flex flex-1 flex-col rounded-[5px] px-0.5 outline-none ${isSel ? "bg-track" : ""}`}
                >
                  <div className="flex flex-1 flex-col justify-end">
                    <div
                      className={`w-full rounded-t-[4px] bg-green ${isSel ? "" : "opacity-[.28]"}`}
                      style={{ height: half(m.incomeCents) }}
                    />
                  </div>
                  <div className="h-px w-full bg-edge" />
                  <div className="flex flex-1 flex-col justify-start">
                    <div
                      className={`w-full rounded-b-[4px] bg-primary ${isSel ? "" : "opacity-[.28]"}`}
                      style={{ height: half(m.expenseCents) }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          {series.map((m) => (
            <span
              key={m.key}
              className={`flex-1 text-center text-[9.5px] font-semibold ${m.key === selectedKey ? "text-ink" : "text-muted"}`}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>

      <MBreakdown
        title="Income"
        categoryRows={incomeCats}
        merchantRows={incomeMerchants}
        empty="No income this month."
      />
      <MBreakdown
        title="Expenses"
        categoryRows={expenseCats}
        merchantRows={expenseMerchants}
        empty="No spending this month."
      />
    </>
  );
}

function MStepBtn({
  dir,
  disabled,
  onClick,
}: {
  dir: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = dir === "prev" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous month" : "Next month"}
      className="flex h-11 w-11 flex-none items-center justify-center rounded-[10px] border border-edge text-muted transition active:bg-track disabled:opacity-40"
    >
      <Icon size={18} strokeWidth={2.2} />
    </button>
  );
}

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

function MBreakdown({
  title,
  categoryRows,
  merchantRows,
  empty,
}: {
  title: string;
  categoryRows: CategorySpend[];
  merchantRows: CategorySpend[];
  empty: string;
}) {
  const [byMerchant, setByMerchant] = useState(false);
  const rows = byMerchant ? merchantRows : categoryRows;
  const total = rows.reduce((sum, r) => sum + r.cents, 0);
  return (
    <div className="mt-[11px] rounded-[10px] border border-edge p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">{title}</span>
        {/* Category ⇄ Merchant toggle (plan 012 Phase 2). */}
        <div className="flex items-center gap-0.5 rounded-[7px] bg-track p-0.5 text-[10px] font-semibold">
          {(
            [
              ["Category", false],
              ["Merchant", true],
            ] as const
          ).map(([label, m]) => (
            <button
              key={label}
              type="button"
              onClick={() => setByMerchant(m)}
              className={`rounded-[5px] px-2 py-1 ${byMerchant === m ? "bg-card text-ink" : "text-muted"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="mt-2 text-[12px] text-muted">{empty}</div>
      ) : (
        rows.slice(0, 4).map((c) => {
          const pct = total > 0 ? Math.round((c.cents / total) * 100) : 0;
          return (
            <div key={c.name} className="mt-2.5">
              <div className="flex justify-between text-[11.5px] font-semibold">
                <span className="min-w-0 truncate">
                  {c.emoji} {c.name}
                </span>
                <span className="tabular-nums">
                  {formatMoney(c.cents)} <span className="font-medium text-muted">{pct}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
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
