"use client";

import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { TrendPeriod } from "@/lib/reports";
import type { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { GroupDetailedSpendingInsights } from "./GroupDetailedSpendingInsights";
import { ReportPeriodControl } from "@/components/shared/ReportPeriodControl";
import { ReportDateControl } from "@/components/shared/ReportDateControl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { GroupSpendingReport } from "./GroupSpendingReport";
import { GroupCashFlowReport } from "./GroupCashFlowReport";

export interface GroupTrendControls {
  view: "cashflow" | "spending";
  period: TrendPeriod;
  onViewChange: (view: "cashflow" | "spending") => void;
  onPeriodChange: (period: TrendPeriod) => void;
}

/** One responsive report tree preserves Group mode/filter state on resize.
 * Explicit data and callbacks never write to Personal report selections. */
export function GroupMobileTrends({
  data,
  source,
  controls,
}: {
  data: GroupSnapshot;
  source: NonNullable<ComponentProps<typeof OverviewSpendingInsights>["source"]>;
  controls: GroupTrendControls;
}) {
  const t = useTranslations("trends");
  const group = useTranslations("groupTrends");
  const { view, period, onViewChange, onPeriodChange } = controls;
  return (
    <div className="group-trends space-y-4" data-workspace="group-trends">
      <div className="flex flex-col items-start justify-between gap-3 lg:flex-row lg:items-center">
        <SegmentedControl
          value={view}
          onChange={onViewChange}
          label={group("reportMode")}
          options={[
            { value: "cashflow", label: t("cashflow") },
            { value: "spending", label: t("spending") },
          ]}
          shape="rounded"
          size="compact"
          className="w-full lg:w-auto"
        />
        {view === "spending" ? (
          <div className="w-full lg:w-auto">
            <ReportPeriodControl
              mobileSheet
              period={period}
              month={source.month}
              onChange={(next, month) => {
                onPeriodChange(next);
                source.onMonthChange(month);
              }}
            />
          </div>
        ) : (
          <ReportDateControl
            mobileSheet
            month={source.month}
            yearly={false}
            directMonthPick
            onMonthChange={source.onMonthChange}
            onSelect={source.onMonthChange}
          />
        )}
      </div>
      {source.loading ? (
        <SkeletonRows />
      ) : (
        <>
          <div hidden={view !== "cashflow"}>
            <GroupCashFlowReport
              transactions={source.transactions}
              recurring={data.recurring ?? []}
              scope={{
                categories: source.categories,
                month: source.month,
                onMonthChange: source.onMonthChange,
              }}
            />
          </div>
          <div hidden={view !== "spending"} className="space-y-4">
            <GroupSpendingReport
              transactions={source.transactions}
              period={period}
              month={source.month}
              onDrillMonth={(month) => {
                onPeriodChange("month");
                source.onMonthChange(month);
              }}
            />
            <GroupDetailedSpendingInsights source={source} />
          </div>
        </>
      )}
    </div>
  );
}
