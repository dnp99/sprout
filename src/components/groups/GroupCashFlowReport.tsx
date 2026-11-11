"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { useCashFlow, type CashFlowScope } from "@/components/shared/useCashFlow";
import { CashFlowChart, type CashFlowChartType } from "@/components/shared/CashFlowChart";
import { CashFlowChartTypeToggle } from "@/components/shared/CashFlowChartTypeToggle";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cashFlowCsv, cashFlowCsvFilename, monthPaceText } from "@/lib/cash-flow";
import { downloadTextFile } from "@/lib/download";
import type { Transaction, RecurringItem } from "@/lib/types";
import type { CategorySpend } from "@/lib/trends";
import { GroupReportCard, GroupReportKpis, GroupReportRows } from "./GroupReportCards";

/** No Spending period is passed to useCashFlow: KPIs/breakdowns describe the
 * focused month, while chart and CSV retain the fixed six-month window. */
export function GroupCashFlowReport({
  transactions,
  recurring,
  scope,
}: {
  transactions: Transaction[];
  recurring: RecurringItem[];
  scope: CashFlowScope;
}) {
  const model = useCashFlow(transactions, recurring, scope);
  const { summary, series, selectedKey, projection } = model;
  const [chartType, setChartType] = useState<CashFlowChartType>("bar");
  const t = useTranslations("trends");
  const group = useTranslations("groupTrends");
  const fmt = useFormatters();
  const sparse =
    series.filter((row) => row.incomeCents !== 0 || row.expenseCents !== 0).length <= 1;
  return (
    <div className="space-y-4">
      <p className="text-meta text-muted" data-report-scope>
        {group("focusedScope", {
          month: fmt.monthKey(selectedKey),
          start: fmt.monthKey(series[0].key),
          end: fmt.monthKey(series[series.length - 1].key),
        })}
      </p>
      <GroupReportKpis
        items={[
          { label: t("income"), value: fmt.money(summary.incomeCents), tone: "positive" },
          { label: t("expenses"), value: fmt.money(summary.expenseCents) },
          {
            label: t("totalSavings"),
            value: fmt.money(summary.netCents, { signed: true }),
            tone: summary.netCents >= 0 ? "positive" : "negative",
          },
          {
            label: t("savingsRate"),
            value: summary.savingsRatePct === null ? "—" : `${summary.savingsRatePct}%`,
            tone: summary.netCents < 0 ? "negative" : undefined,
          },
        ]}
      />
      <GroupReportCard
        title={t("chartTitle", { count: series.length })}
        action={<CashFlowChartTypeToggle value={chartType} onChange={setChartType} />}
      >
        <div className="mb-4 flex flex-wrap gap-4 text-meta text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green" />
            {t("legendIncome")}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" />
            {t("legendExpenses")}
          </span>
          {chartType === "bar" && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-px w-3 bg-ink" />
              {t("legendNet")}
            </span>
          )}
        </div>
        <CashFlowChart
          series={series}
          selectedKey={selectedKey}
          chartType={chartType}
          projection={projection}
          onPick={model.setPicked}
          expanded
        />
        {projection && <p className="mt-3 text-meta text-muted">{monthPaceText(projection)}</p>}
        {sparse && (
          <div className="mt-4 rounded-[10px] bg-track p-3">
            <p className="mb-2 text-meta text-muted">
              {group("sparseScope", { month: fmt.monthKey(selectedKey) })}
            </p>
            <div className="flex flex-wrap justify-between gap-2 text-body tabular-nums">
              <span className="text-green">
                {t("income")} · {fmt.money(summary.incomeCents)}
              </span>
              <span>
                {t("expenses")} · {fmt.money(summary.expenseCents)}
              </span>
            </div>
          </div>
        )}
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => downloadTextFile(cashFlowCsvFilename(series), cashFlowCsv(series))}
            className="flex min-h-11 items-center gap-2 rounded-[8px] border border-edge px-3 text-label font-medium text-ink hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Download size={16} />
            {t("exportCsv")}
          </button>
        </div>
      </GroupReportCard>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <GroupCashFlowBreakdown
          title={t("income")}
          primaryLabel={t("incomeSource")}
          categories={model.incomeCats}
          merchants={model.incomeMerchants}
          empty={t("emptyIncome")}
        />
        <GroupCashFlowBreakdown
          title={t("expenses")}
          categories={model.expenseCats}
          merchants={model.expenseMerchants}
          groups={model.expenseGroups}
          empty={t("emptyExpenses")}
        />
      </div>
    </div>
  );
}

function GroupCashFlowBreakdown({
  title,
  primaryLabel,
  categories,
  merchants,
  groups,
  empty,
}: {
  title: string;
  primaryLabel?: string;
  categories: CategorySpend[];
  merchants: CategorySpend[];
  groups?: CategorySpend[];
  empty: string;
}) {
  const [mode, setMode] = useState("category");
  const t = useTranslations("trends");
  const fmt = useFormatters();
  const rows = mode === "merchant" ? merchants : mode === "group" ? (groups ?? []) : categories;
  return (
    <GroupReportCard title={title}>
      <SegmentedControl
        value={mode}
        onChange={setMode}
        label={title}
        options={[
          { value: "category", label: primaryLabel ?? t("category") },
          { value: "merchant", label: t("merchant") },
          ...(groups ? [{ value: "group", label: t("group") }] : []),
        ]}
        shape="rounded"
        size="compact"
        className="mb-2 max-w-full"
      />
      <GroupReportRows
        rows={rows.map((row) => ({ id: row.name, label: row.name, value: fmt.money(row.cents) }))}
        empty={empty}
      />
    </GroupReportCard>
  );
}
