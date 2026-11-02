"use client";

import { ReportDateControl } from "@/components/shared/ReportDateControl";
import { ReportPeriodControl } from "@/components/shared/ReportPeriodControl";
import type { GroupTrendControls } from "./GroupMobileTrends";

/** The mobile Spending period replaces its month picker; desktop keeps the
 * original date control regardless of the mobile report's selected mode. */
export function GroupHeaderReportControls({
  tab,
  month,
  date,
  busy,
  trends,
  onMonthChange,
  onDateChange,
}: {
  tab: string;
  month: string;
  date?: string;
  busy: boolean;
  trends: GroupTrendControls;
  onMonthChange: (month: string) => void;
  onDateChange: (date: string | undefined) => void;
}) {
  const periodControl = ["trends", "budget", "goals"].includes(tab);
  return (
    <div
      className={`${tab === "overview" ? "hidden lg:flex" : "flex"} flex-wrap items-center justify-end gap-2 lg:gap-2.5`}
    >
      {periodControl && (
        <div className="w-[min(66vw,264px)] lg:hidden">
          <ReportPeriodControl
            period={trends.period}
            month={month}
            disabled={busy}
            onChange={(period, anchor) => {
              trends.onPeriodChange(period);
              onMonthChange(anchor);
            }}
          />
        </div>
      )}
      {tab !== "settings" && (
        <div
          className={
            tab === "overview" || periodControl ? "hidden space-y-1 lg:block" : "space-y-1"
          }
        >
          <ReportDateControl
            month={month}
            date={tab === "transactions" ? date : undefined}
            yearly={false}
            directMonthPick
            disabled={busy}
            onMonthChange={onMonthChange}
            onSelect={(value, selectedDate) => {
              onMonthChange(value);
              onDateChange(selectedDate);
            }}
          />
        </div>
      )}
    </div>
  );
}
