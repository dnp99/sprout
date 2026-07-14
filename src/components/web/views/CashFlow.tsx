"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { type CategorySpend } from "@/lib/trends";
import { cashFlowCsv, cashFlowCsvFilename } from "@/lib/cash-flow";
import { downloadTextFile } from "@/lib/download";
import { useCashFlow } from "@/components/shared/useCashFlow";
import { CashFlowChart, type CashFlowChartType } from "@/components/shared/CashFlowChart";
import type { RecurringItem, Transaction } from "@/lib/types";

/** Cash-flow report (plan 012): income vs. expenses vs. net over a fixed
 *  6-month window, a savings-rate summary for the selected month, and income /
 *  expense category breakdowns. All figures come from the transaction-derived
 *  view-model (which drops budget-excluded rows), so it ties out to the budget. */
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
  } = useCashFlow(transactions, recurring);
  const [chartType, setChartType] = useState<CashFlowChartType>("bar");

  return (
    <div className="mt-4 flex flex-col">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadTextFile(cashFlowCsvFilename(series), cashFlowCsv(series))}
          className="flex items-center gap-1.5 rounded-[9px] border border-edge px-3 py-1.5 text-[12.5px] font-semibold text-muted transition hover:text-ink"
        >
          <Download size={14} strokeWidth={2.2} /> Export CSV
        </button>
      </div>

      {/* Summary for the selected month */}
      <div className="mt-[13px] grid grid-cols-4 gap-[13px]">
        <Stat label="Income" value={formatMoney(summary.incomeCents)} sub="This month" tone="pos" />
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

      {/* Income (up) / expense (down) chart with a net line — or a line chart */}
      <div className="mt-[14px] rounded-[14px] border border-edge p-[18px]">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold">Cash flow · last {series.length} months</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green" /> Income
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Expenses
              </span>
              {chartType === "bar" && (
                <span className="flex items-center gap-1">
                  <span className="h-[2px] w-3 bg-ink" /> Net
                </span>
              )}
            </div>
            <ChartTypeToggle value={chartType} onChange={setChartType} />
          </div>
        </div>
        <div className="mt-4">
          <CashFlowChart
            series={series}
            selectedKey={selectedKey}
            chartType={chartType}
            projection={projection}
            onPick={setPicked}
          />
        </div>
        {projection && (
          <div className="mt-2.5 text-[11.5px] text-muted">
            On pace for{" "}
            <span className="font-semibold text-primary">
              {formatMoney(projection.projectedExpenseCents)}
            </span>{" "}
            in spending this month · {projection.daysElapsed} of {projection.daysInMonth} days in.
          </div>
        )}
      </div>

      {/* Income + expense category breakdowns for the selected month */}
      <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
        <Breakdown
          title="Income"
          categoryRows={incomeCats}
          merchantRows={incomeMerchants}
          empty="No income this month."
        />
        <Breakdown
          title="Expenses"
          categoryRows={expenseCats}
          merchantRows={expenseMerchants}
          groupRows={expenseGroups}
          empty="No spending this month."
        />
      </div>
    </div>
  );
}

/** Bar ⇄ line chart-type toggle (plan 012 Phase 2). */
function ChartTypeToggle({
  value,
  onChange,
}: {
  value: CashFlowChartType;
  onChange: (v: CashFlowChartType) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[8px] bg-track p-0.5 text-[11px] font-semibold">
      {(["bar", "line"] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-[6px] px-2 py-0.5 capitalize transition ${value === t ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {t}
        </button>
      ))}
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

type BreakdownMode = "category" | "merchant" | "group";

function Breakdown({
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
    <div className="overflow-hidden rounded-[14px] border border-edge p-[16px_18px]">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-bold">{title}</span>
        {/* Category / Merchant (/ Group) toggle (plan 012 Phase 2–3). */}
        <div className="flex items-center gap-0.5 rounded-[8px] bg-track p-0.5 text-[11px] font-semibold">
          {options.map(([label, m]) => (
            <button
              key={label}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-[6px] px-2 py-0.5 transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
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
