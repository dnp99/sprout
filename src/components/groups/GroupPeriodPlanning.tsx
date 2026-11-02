"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { periodMonthKeys, type TrendPeriod } from "@/lib/reports";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { aggregateGroupBudgets } from "@/lib/groups/period-report";
import { groupFetch } from "@/state/groups";
import { SkeletonRows } from "@/components/ui/Skeleton";
import { GroupBudget } from "./GroupBudget";
import { GroupFeatures } from "./GroupFeatures";

/** Multi-month budgets are a read-only sum of actual saved monthly plans.
 * Goals expose current progress for matching deadlines, not invented history. */
export function GroupPeriodPlanning({
  data,
  month,
  period,
  tab,
  run,
  busy,
  mobile,
}: {
  data: GroupSnapshot;
  month: string;
  period: TrendPeriod;
  tab: "budget" | "goals" | "bills";
  run: (operation: GroupOperation) => Promise<unknown>;
  busy: boolean;
  mobile: boolean;
}) {
  const t = useTranslations("reportPeriod");
  const groups = useTranslations("groups");
  const fmt = useFormatters();
  const keys = useMemo(() => periodMonthKeys(period, month), [period, month]);
  const range = `${fmt.monthKey(keys[0])} – ${fmt.monthKey(keys[keys.length - 1])}`;
  const [report, setReport] = useState<{
    source: GroupSnapshot;
    keys: string[];
    data?: GroupSnapshot;
    error?: string;
  }>();
  const aggregate = mobile && tab === "budget" && keys.length > 1;
  useEffect(() => {
    if (!aggregate) return;
    const abort = new AbortController();
    async function load() {
      try {
        const months = await Promise.all(
          keys.map((key) =>
            groupFetch<GroupSnapshot>(
              `/api/groups/${data.group.id}?month=${key}`,
              undefined,
              abort.signal,
            ),
          ),
        );
        // Concurrent edits must not produce a total assembled from revisions
        // that never existed together. A refresh retries from a new snapshot.
        if (months.some((row) => row.group.revision !== data.group.revision))
          throw Error(groups("reload"));
        if (!abort.signal.aborted)
          setReport({ source: data, keys, data: { ...data, ...aggregateGroupBudgets(months) } });
      } catch (error) {
        if (!abort.signal.aborted)
          setReport({
            source: data,
            keys,
            error: error instanceof Error ? error.message : groups("failed"),
          });
      }
    }
    void load();
    return () => abort.abort();
  }, [aggregate, data, keys, month, groups]);

  if (aggregate) {
    if (report?.source !== data || report.keys !== keys) return <SkeletonRows />;
    if (report.error)
      return (
        <p role="alert" className="text-sm text-danger">
          {report.error}
        </p>
      );
    if (!report.data) return <SkeletonRows />;
    return (
      <GroupBudget
        key={range}
        data={report.data}
        month={month}
        run={run}
        busy={busy}
        readOnly
        periodLabel={range}
      />
    );
  }
  if (tab === "budget")
    return (
      <GroupBudget
        key={`${month}:${JSON.stringify(data.budget)}`}
        data={data}
        month={month}
        run={run}
        busy={busy}
      />
    );
  const scoped =
    mobile && tab === "goals"
      ? {
          ...data,
          goals: data.goals?.filter(
            (goal) => !goal.targetDate || keys.includes(goal.targetDate.slice(0, 7)),
          ),
        }
      : data;
  return (
    <>
      {mobile && tab === "goals" && (
        <p className="text-xs text-muted">
          {keys.length === 1 ? fmt.monthKey(month) : range} · {t("goalsHint")}
        </p>
      )}
      <GroupFeatures data={scoped} month={month} tab={tab} run={run} />
    </>
  );
}
