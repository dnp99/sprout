"use client";

import type { ComponentProps } from "react";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { TrendPeriod } from "@/lib/reports";
import { MobileTrendsReport } from "@/components/mobile/screens/Trends";
import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { SkeletonRows } from "@/components/ui/Skeleton";

export interface GroupTrendControls {
  view: "cashflow" | "spending";
  period: TrendPeriod;
  onViewChange: (view: "cashflow" | "spending") => void;
  onPeriodChange: (period: TrendPeriod) => void;
}

/** Group-only analysis follows the shared report rather than replacing it.
 * Local mode/period state and explicit scope keep Personal selections isolated. */
export function GroupMobileTrends({
  data,
  source,
  controls,
}: {
  data: GroupSnapshot;
  source: NonNullable<ComponentProps<typeof OverviewSpendingInsights>["source"]>;
  controls: GroupTrendControls;
}) {
  const { view, period, onViewChange, onPeriodChange } = controls;
  if (source.loading) return <SkeletonRows />;
  return (
    <div className="pt-1.5">
      <MobileTrendsReport
        anchorAllPeriods
        className=""
        transactions={source.transactions}
        recurring={data.recurring ?? []}
        trendPeriod={period}
        trendMonthKey={source.month}
        trendView={view}
        onViewChange={onViewChange}
        onDrillMonth={(month) => {
          onPeriodChange("month");
          source.onMonthChange(month);
        }}
        cashFlowScope={{
          period,
          categories: source.categories,
          month: source.month,
          onMonthChange: (month) => {
            onPeriodChange("month");
            source.onMonthChange(month);
          },
        }}
      />
      {view === "spending" && (
        <section className="mt-[11px] border-t border-edge pt-3">
          <OverviewSpendingInsights compact source={source} />
        </section>
      )}
    </div>
  );
}
