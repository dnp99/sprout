"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { buildTrendsReport, type TrendPeriod } from "@/lib/reports";
import type { Transaction } from "@/lib/types";
import { futureReportPoints } from "@/lib/groups/report-presentation";
import { SpendingBarChart } from "@/components/shared/SpendingBarChart";
import { GroupReportCard, GroupReportKpis, GroupReportRows } from "./GroupReportCards";

/** Group owns the scope; the established Personal report engine owns all cents. */
export function GroupSpendingReport({
  transactions,
  period,
  month,
  onDrillMonth,
}: {
  transactions: Transaction[];
  period: TrendPeriod;
  month: string;
  onDrillMonth: (month: string) => void;
}) {
  const t = useTranslations("trends");
  const group = useTranslations("groupTrends");
  const fmt = useFormatters();
  const report = useMemo(
    () => buildTrendsReport(transactions, period, month, fmt.locale),
    [transactions, period, month, fmt.locale],
  );
  const chart = report.chart;
  const future = futureReportPoints(
    transactions,
    chart.points.map((point) => point.key),
  );
  const comparison = chart.comparisonLabel
    ? chart.comparisonThroughDay === null
      ? t("vsRange", { range: chart.comparisonLabel })
      : t("vsRangeThroughDay", { range: chart.comparisonLabel, day: chart.comparisonThroughDay })
    : undefined;
  return (
    <div className="space-y-4">
      <p className="text-meta text-muted" data-report-scope>
        {group("fullPeriodScope", {
          range: period === "month" ? fmt.monthKey(month) : report.rangeLabel,
        })}
        {future.count > 0 && (
          <span className="mt-1 block">{group("futureIncluded", { count: future.count })}</span>
        )}
      </p>
      <GroupReportKpis
        items={[
          { label: t("totalIncome"), value: fmt.money(report.incomeCents), tone: "positive" },
          { label: t("totalSpending"), value: fmt.money(report.spendingCents) },
          {
            label: t("net"),
            value: fmt.money(report.netCents, { signed: true }),
            tone: report.netCents >= 0 ? "positive" : "negative",
          },
          { label: t("transactions"), value: report.txnCount.toLocaleString(fmt.locale) },
        ]}
      />
      <GroupReportCard
        title={`${t("spendingTitle")} · ${report.rangeLabel}`}
        subtitle={chart.granularity === "day" ? t("hintDailyWeb") : t("clickToDrill")}
        action={
          chart.changePct !== null && period === "month" ? (
            <span
              className={`text-label font-semibold tabular-nums ${chart.changePct <= 0 ? "text-green" : "text-danger"}`}
            >
              {chart.changePct > 0 ? "+" : ""}
              {chart.changePct}%
            </span>
          ) : undefined
        }
      >
        {comparison && <p className="mb-3 text-meta text-muted">{comparison}</p>}
        <SpendingBarChart
          key={`${period}:${month}`}
          chart={chart}
          onSelectMonth={onDrillMonth}
          expanded
          futureKeys={future.keys}
        />
        {future.keys.length > 0 && (
          <p className="mt-2 text-meta text-muted">
            {group(chart.granularity === "day" ? "futureLegend" : "futureMonthlyLegend")}
          </p>
        )}
      </GroupReportCard>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <GroupReportCard title={t("byCategoryLabel")} subtitle={report.rangeLabel}>
          <GroupReportRows
            key={`${period}:${month}`}
            empty={t("noSpendingPeriod")}
            rows={report.byCategory.map((row) => ({
              id: row.name,
              label: row.name,
              value: fmt.money(row.cents),
              detail: `${Math.round(row.pct)}%`,
            }))}
          />
        </GroupReportCard>
        <GroupReportCard title={t("frequentSpotsLabel")} subtitle={t("mostVisits")}>
          <GroupReportRows
            key={`${period}:${month}`}
            empty={t("noSpendingPeriod")}
            rows={report.frequentSpots.map((row) => ({
              id: row.name,
              label: row.name,
              value: fmt.money(row.cents),
              detail: group("visits", { count: row.count }),
            }))}
          />
        </GroupReportCard>
        <GroupReportCard
          title={t("topMovers")}
          subtitle={t("vsRange", { range: report.previousRangeLabel })}
        >
          <GroupReportRows
            key={`${period}:${month}`}
            empty={t("noChange")}
            rows={report.topMovers.map((row) => ({
              id: row.name,
              label: row.name,
              value: fmt.money(row.deltaCents, { signed: true }),
              tone: row.deltaCents <= 0 ? "positive" : "negative",
            }))}
          />
        </GroupReportCard>
      </div>
    </div>
  );
}
