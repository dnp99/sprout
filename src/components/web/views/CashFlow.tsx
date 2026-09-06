"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { type CategorySpend } from "@/lib/trends";
import { cashFlowCsv, cashFlowCsvFilename, monthPaceText } from "@/lib/cash-flow";
import { downloadTextFile } from "@/lib/download";
import { useCashFlow } from "@/components/shared/useCashFlow";
import { CashFlowChart, type CashFlowChartType } from "@/components/shared/CashFlowChart";
import type { RecurringItem, Transaction } from "@/lib/types";
import { useTranslations } from "next-intl";

/** Cash-flow report (plan 012): income vs. expenses vs. net over a fixed
 *  6-month window, a savings-rate summary for the selected month, and income /
 *  expense breakdowns. Income is grouped by source, not expense category. All figures come from the transaction-derived
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
  const t = useTranslations("trends");
  const [chartType, setChartType] = useState<CashFlowChartType>("bar");

  return (
    <div className="mt-4 flex flex-col">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => downloadTextFile(cashFlowCsvFilename(series), cashFlowCsv(series))}
          className="flex items-center gap-1.5 rounded-[9px] border border-edge px-3 py-1.5 text-[12.5px] font-semibold text-muted transition hover:text-ink"
        >
          <Download size={14} strokeWidth={2.2} /> {t("exportCsv")}
        </button>
      </div>

      {/* Summary for the selected month */}
      <div className="mt-[13px] grid grid-cols-4 gap-[13px]">
        <Stat
          label={t("income")}
          value={formatMoney(summary.incomeCents)}
          sub={t("thisMonth")}
          tone="pos"
        />
        <Stat
          label={t("expenses")}
          value={formatMoney(summary.expenseCents)}
          sub={t("thisMonth")}
        />
        <Stat
          label={t("totalSavings")}
          value={formatMoney(summary.netCents, { signed: true })}
          sub={summary.netCents >= 0 ? t("saved") : t("overspent")}
          tone={summary.netCents >= 0 ? "pos" : "primary"}
        />
        <Stat
          label={t("savingsRate")}
          value={summary.savingsRatePct === null ? "—" : `${summary.savingsRatePct}%`}
          sub={t("ofIncome")}
        />
      </div>

      {/* Income (up) / expense (down) chart with a net line — or a line chart */}
      <div className="mt-[14px] rounded-[14px] border border-edge bg-card p-[18px]">
        <div className="flex items-center justify-between">
          <div className="text-[14px] font-bold">{t("chartTitle", { count: series.length })}</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-[11px] font-semibold text-muted">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green" /> {t("legendIncome")}
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> {t("legendExpenses")}
              </span>
              {chartType === "bar" && (
                <span className="flex items-center gap-1">
                  <span className="h-[2px] w-3 bg-ink" /> {t("legendNet")}
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
          <div className="mt-2.5 text-[11.5px] text-muted">{monthPaceText(projection)}</div>
        )}
      </div>

      {/* Income + expense category breakdowns for the selected month */}
      <div className="mt-[14px] grid grid-cols-2 gap-[14px]">
        <Breakdown
          title={t("income")}
          categoryRows={incomeCats}
          merchantRows={incomeMerchants}
          primaryLabel={t("incomeSource")}
          empty={t("emptyIncome")}
        />
        <Breakdown
          title={t("expenses")}
          categoryRows={expenseCats}
          merchantRows={expenseMerchants}
          groupRows={expenseGroups}
          empty={t("emptyExpenses")}
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
  const t = useTranslations("trends");
  return (
    <div className="flex items-center gap-0.5 rounded-[8px] bg-track p-0.5 text-[11px] font-semibold">
      {(["bar", "line"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`rounded-[6px] px-2 py-0.5 capitalize transition ${value === v ? "bg-primary text-onprimary shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {t(v)}
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
    <div className="rounded-[14px] border border-edge bg-card p-[13px_15px]">
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
  primaryLabel,
  groupRows,
  empty,
}: {
  title: string;
  categoryRows: CategorySpend[];
  merchantRows: CategorySpend[];
  primaryLabel?: string;
  /** Fixed/Flexible rows — expense side only; omitted hides the Group option. */
  groupRows?: CategorySpend[];
  empty: string;
}) {
  const t = useTranslations("trends");
  const [mode, setMode] = useState<BreakdownMode>("category");
  const options: [string, BreakdownMode][] = [
    [primaryLabel ?? t("category"), "category"],
    [t("merchant"), "merchant"],
    ...(groupRows ? ([[t("group"), "group"]] as [string, BreakdownMode][]) : []),
  ];
  const rows =
    mode === "merchant" ? merchantRows : mode === "group" ? (groupRows ?? []) : categoryRows;
  const total = rows.reduce((sum, r) => sum + r.cents, 0);
  return (
    <div className="overflow-hidden rounded-[14px] border border-edge bg-card p-[16px_18px]">
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-bold">{title}</span>
        {/* Category / Merchant (/ Group) toggle (plan 012 Phase 2–3). */}
        <div className="flex items-center gap-0.5 rounded-[8px] bg-track p-0.5 text-[11px] font-semibold">
          {options.map(([label, m]) => (
            <button
              key={label}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-[6px] px-2 py-0.5 transition ${mode === m ? "bg-primary text-onprimary" : "text-muted hover:text-ink"}`}
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
