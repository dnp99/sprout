"use client";

import { useMemo } from "react";
import { ArrowDown, ArrowUp, TrendingUp } from "lucide-react";
import { SpendingBarChart } from "@/components/shared/SpendingBarChart";
import { DesktopEmpty } from "@/components/web/DesktopEmpty";
import { CashFlow } from "./CashFlow";
import { formatMoney } from "@/lib/format";
import { buildTrendsReport } from "@/lib/reports";
import { latestMonthKey } from "@/lib/trends";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";

export function Trends() {
  const { transactions, recurring, trendPeriod, trendMonthKey, trendView, set } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      recurring: s.recurring,
      trendPeriod: s.trendPeriod,
      trendMonthKey: s.trendMonthKey,
      trendView: s.trendView,
      set: s.set,
    })),
  );
  const t = useTranslations("trends");
  const fmt = useFormatters();

  // The "month" period can be drilled into a specific month (by clicking a bar);
  // every other period anchors to the latest month with data.
  const report = useMemo(() => {
    const anchor = trendPeriod === "month" && trendMonthKey ? trendMonthKey : undefined;
    return buildTrendsReport(transactions, trendPeriod, anchor, fmt.locale);
  }, [transactions, trendPeriod, trendMonthKey, fmt.locale]);

  if (transactions.length === 0) {
    return (
      <DesktopEmpty icon={TrendingUp} title={t("emptyTitle")} description={t("emptyBodyWeb")}>
        <button
          type="button"
          onClick={() => set({ webView: "import" })}
          className="rounded-[10px] border border-edge px-5 py-[11px] text-[13px] font-semibold"
        >
          {t("importPast")}
        </button>
      </DesktopEmpty>
    );
  }

  const { chart } = report;
  const chartLabel =
    report.period === "month"
      ? report.rangeLabel
      : report.period === "ytd"
        ? t("chartYtd")
        : t("chartLastMonths", { count: chart.points.length });
  const drillMonth = (key: string) => set({ trendPeriod: "month", trendMonthKey: key });

  return (
    <div className="flex flex-col">
      {/* Cash flow ⇄ Spending mode toggle (plan 012). */}
      <div className="mt-4 flex w-fit items-center gap-1 rounded-[12px] border border-edge bg-card p-1">
        {(["cashflow", "spending"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => set({ trendView: v })}
            className={`rounded-[9px] px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              trendView === v ? "bg-primary text-onprimary" : "text-muted hover:text-ink"
            }`}
          >
            {v === "cashflow" ? t("cashflow") : t("spending")}
          </button>
        ))}
      </div>

      {trendView === "cashflow" ? (
        <CashFlow transactions={transactions} recurring={recurring} />
      ) : (
        <div className="mt-4 flex flex-col">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-[13px]">
            <Stat
              label={t("totalIncome")}
              value={formatMoney(report.incomeCents)}
              sub={report.rangeLabel}
              tone="pos"
            />
            <Stat
              label={t("totalSpending")}
              value={formatMoney(report.spendingCents)}
              sub={report.rangeLabel}
            />
            <Stat
              label={t("net")}
              value={formatMoney(report.netCents, { signed: true })}
              sub={t("savedThisPeriod")}
              tone="primary"
            />
            <Stat
              label={t("transactions")}
              value={report.txnCount.toLocaleString()}
              sub={t("acrossMonths", { count: report.monthsInWindow })}
            />
          </div>

          {/* Spending chart */}
          <div className="mt-[14px] rounded-[14px] border border-edge bg-card p-[18px]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[14px] font-bold">
                  {t("spendingTitle")} · {chartLabel}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  {chart.granularity === "day" ? t("hintDailyWeb") : t("clickToDrill")}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[22px] font-bold tracking-[-0.02em] tabular-nums">
                  {formatMoney(chart.totalCents)}
                  {report.period === "month" && chart.changePct !== null && (
                    <span
                      className={`ml-1 inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${chart.changePct <= 0 ? "text-green" : "text-primary"}`}
                    >
                      {chart.changePct <= 0 ? (
                        <ArrowDown size={13} strokeWidth={2.5} />
                      ) : (
                        <ArrowUp size={13} strokeWidth={2.5} />
                      )}
                      {Math.abs(chart.changePct)}%
                    </span>
                  )}
                </div>
                {report.period === "month" && chart.comparisonLabel && (
                  <div className="mt-0.5 text-[10.5px] font-medium text-muted">
                    {chart.comparisonThroughDay === null
                      ? t("vsRange", { range: chart.comparisonLabel })
                      : t("vsRangeThroughDay", {
                          range: chart.comparisonLabel,
                          day: chart.comparisonThroughDay,
                        })}
                  </div>
                )}
              </div>
            </div>
            <SpendingBarChart chart={chart} onSelectMonth={drillMonth} />
          </div>

          {/* By category + frequent spots / top movers */}
          <div className="mt-[14px] grid grid-cols-[1.35fr_1fr] items-stretch gap-[14px]">
            <div className="rounded-[14px] border border-edge bg-card p-[16px_18px]">
              <div className="flex items-center justify-between">
                <span className="text-[13.5px] font-bold">{t("byCategoryLabel")}</span>
                <span className="text-[11px] text-muted">{report.rangeLabel}</span>
              </div>
              {report.byCategory.length === 0 ? (
                <div className="mt-3 text-[12.5px] text-muted">{t("noSpendingPeriod")}</div>
              ) : (
                report.byCategory.slice(0, 5).map((c) => (
                  <div key={c.name} className="mt-[11px]">
                    <div className="flex justify-between text-[12.5px] font-semibold">
                      <span>{c.name}</span>
                      <span className="tabular-nums">
                        {formatMoney(c.cents)}
                        <span className="ml-1 font-medium text-muted">{Math.round(c.pct)}%</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-[7px] overflow-hidden rounded-full bg-track">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-[14px]">
              <div className="rounded-[14px] border border-edge bg-card p-[15px_16px]">
                <div className="text-[13.5px] font-bold">{t("frequentSpotsLabel")}</div>
                <div className="mt-px text-[10.5px] text-muted">{t("mostVisits")}</div>
                {report.frequentSpots.slice(0, 3).map((m) => (
                  <div key={m.name} className="mt-2.5 flex items-center justify-between">
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold">
                      {m.name}{" "}
                      <span className="font-normal text-muted">· {formatMoney(m.cents)}</span>
                    </span>
                    <span className="ml-2 text-[11.5px] font-semibold text-primary">
                      {m.count} visit{m.count === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-[14px] border border-edge bg-card p-[15px_16px]">
                <div className="text-[13.5px] font-bold">{t("topMovers")}</div>
                <div className="mt-px text-[10.5px] text-muted">
                  {t("vsRange", { range: report.previousRangeLabel })}
                </div>
                {report.topMovers.length === 0 ? (
                  <div className="mt-2.5 text-[12.5px] text-muted">{t("noChange")}</div>
                ) : (
                  report.topMovers.slice(0, 3).map((m) => (
                    <div key={m.name} className="mt-2.5 flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold">{m.name}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 text-[12.5px] font-semibold ${m.deltaCents < 0 ? "text-green" : "text-primary"}`}
                      >
                        {m.deltaCents < 0 ? (
                          <ArrowDown size={13} strokeWidth={2.5} />
                        ) : (
                          <ArrowUp size={13} strokeWidth={2.5} />
                        )}
                        {formatMoney(Math.abs(m.deltaCents))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** One summary tile — `pos` colors the value green, `primary` terracotta. */
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
