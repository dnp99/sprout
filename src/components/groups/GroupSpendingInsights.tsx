"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { GroupSnapshot } from "@/lib/groups/dto";
import { OverviewSpendingInsights } from "@/components/shared/OverviewSpendingInsights";
import { groupTrendSource } from "@/lib/groups/trend-source";
import { GroupMobileTrends, type GroupTrendControls } from "./GroupMobileTrends";

/** Preserve actual payer identity and signed refunds; shares/author IDs are
 * never substitutes for who paid. The complete authorized ledger is required. */
export function GroupSpendingInsights({
  data,
  month,
  onMonthChange,
  mobileTrends,
}: {
  data: GroupSnapshot;
  month: string;
  onMonthChange: (month: string) => void;
  mobileTrends?: GroupTrendControls;
}) {
  const t = useTranslations("groups");
  const source = useMemo(() => {
    return {
      ...groupTrendSource(data, {
        sharedFunds: t("sharedFunds"),
        uncategorized: t("uncategorized"),
      }),
      month,
      onMonthChange,
    };
  }, [data, month, onMonthChange, t]);
  if (!mobileTrends) return <OverviewSpendingInsights source={source} />;
  return (
    <>
      <div className="lg:hidden">
        <GroupMobileTrends data={data} source={source} controls={mobileTrends} />
      </div>
      <div className="hidden lg:block">
        <OverviewSpendingInsights source={source} dateControlTargetId="group-trends-date-control" />
      </div>
    </>
  );
}
