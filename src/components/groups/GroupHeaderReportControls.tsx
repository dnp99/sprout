"use client";

import { ReportDateControl } from "@/components/shared/ReportDateControl";
import { ReportPeriodControl } from "@/components/shared/ReportPeriodControl";
import type { GroupTrendControls } from "./GroupMobileTrends";

/** Mobile owns its period control; desktop provides a slot for the report's
 * stateful date control instead of introducing a second month-only picker. */
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
      className={`${tab === "overview" ? "hidden lg:flex" : "flex"} ${periodControl ? "w-full flex-wrap" : "w-auto shrink-0 flex-nowrap"} items-center justify-end gap-2 lg:w-auto lg:gap-2.5`}
    >
      {periodControl && (
        <div className="w-full lg:hidden">
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
      {tab === "trends" && <div id="group-trends-date-control" className="hidden lg:block" />}
      {tab !== "settings" && tab !== "trends" && (
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
