"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { monthKeyLabel, type CategorySpend } from "@/lib/trends";
import { cashFlowCsv, cashFlowCsvFilename } from "@/lib/cash-flow";
import { downloadTextFile } from "@/lib/download";
import { useCashFlow } from "@/components/shared/useCashFlow";
import { CashFlowChart, type CashFlowChartType } from "@/components/shared/CashFlowChart";
import type { RecurringItem, Transaction } from "@/lib/types";

/** Mobile cash-flow report (plan 012): the selected month's income / expenses /
 *  savings, a compact income-up/expense-down chart with a net line, and income /
 *  expense breakdowns. Shares its numbers with the web view via useCashFlow. */
export function CashFlow({
  transactions,
  recurring = [],
}: {
  transactions: Transaction[];
  recurring?: RecurringItem[];
}) {
  const {
    series,
    selectedKey,
    summary,
    incomeCats,
    expenseCats,
    incomeMerchants,
    expenseMerchants,
    expenseGroups,
    projection,
    setPicked,
    stepMonth,
    canPrev,
    canNext,
  } = useCashFlow(transactions, recurring);
  const [chartType, setChartType] = useState<CashFlowChartType>("bar");

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

      {/* Income (up) / expense (down) chart with a net line — or a line chart */}
      <div className="mt-[11px] rounded-[10px] border border-edge p-3.5">
        <div className="flex items-center justify-between text-[11px] font-medium text-muted">
          <span>Cash flow · last {series.length} months</span>
          <MChartTypeToggle value={chartType} onChange={setChartType} />
        </div>
        <div className="mt-3">
          <CashFlowChart
            series={series}
            selectedKey={selectedKey}
            chartType={chartType}
            projection={projection}
            onPick={setPicked}
            dense
          />
        </div>
        {projection && (
          <div className="mt-2 text-[10.5px] text-muted">
            On pace for{" "}
            <span className="font-semibold text-primary">
              {formatMoney(projection.projectedExpenseCents)}
            </span>{" "}
            · {projection.daysElapsed}/{projection.daysInMonth} days
          </div>
        )}
      </div>

      <div className="mt-[11px] flex justify-end">
        <button
          type="button"
          onClick={() => downloadTextFile(cashFlowCsvFilename(series), cashFlowCsv(series))}
          className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] border border-edge px-3.5 text-[12px] font-semibold text-muted active:bg-track"
        >
          <Download size={14} strokeWidth={2.2} /> Export CSV
        </button>
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
        groupRows={expenseGroups}
        empty="No spending this month."
      />
    </>
  );
}

/** Bar ⇄ line chart-type toggle (plan 012 Phase 2). */
function MChartTypeToggle({
  value,
  onChange,
}: {
  value: CashFlowChartType;
  onChange: (v: CashFlowChartType) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[7px] bg-track p-0.5 text-[10px] font-semibold">
      {(["bar", "line"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-[5px] px-2 py-1 capitalize ${value === t ? "bg-card text-ink" : "text-muted"}`}
        >
          {t}
        </button>
      ))}
    </div>
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

type BreakdownMode = "category" | "merchant" | "group";

function MBreakdown({
  title,
  categoryRows,
  merchantRows,
  groupRows,
  empty,
}: {
  title: string;
  categoryRows: CategorySpend[];
  merchantRows: CategorySpend[];
  /** Fixed/Flexible rows — expense side only; omitted hides the Group option. */
  groupRows?: CategorySpend[];
  empty: string;
}) {
  const [mode, setMode] = useState<BreakdownMode>("category");
  const options: [string, BreakdownMode][] = [
    ["Category", "category"],
    ["Merchant", "merchant"],
    ...(groupRows ? ([["Group", "group"]] as [string, BreakdownMode][]) : []),
  ];
  const rows =
    mode === "merchant" ? merchantRows : mode === "group" ? (groupRows ?? []) : categoryRows;
  const total = rows.reduce((sum, r) => sum + r.cents, 0);
  return (
    <div className="mt-[11px] rounded-[10px] border border-edge p-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted">{title}</span>
        {/* Category / Merchant (/ Group) toggle (plan 012 Phase 2–3). */}
        <div className="flex items-center gap-0.5 rounded-[7px] bg-track p-0.5 text-[10px] font-semibold">
          {options.map(([label, m]) => (
            <button
              key={label}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-[5px] px-2 py-1 ${mode === m ? "bg-card text-ink" : "text-muted"}`}
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
