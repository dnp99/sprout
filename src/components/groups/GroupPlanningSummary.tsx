"use client";

import { useTranslations } from "next-intl";
import { MobileReportStat } from "@/components/shared/MobileReportStat";
import { formatMoney } from "@/lib/format";
import type { GroupSnapshot } from "@/lib/groups/dto";

/** Planning summaries use saved ledger values, never unsaved form drafts. */
export function GroupPlanningSummary({
  data,
  section,
  budgetLabel,
}: {
  data: GroupSnapshot;
  section: "budget" | "goals";
  budgetLabel?: string;
}) {
  const t = useTranslations("mobileReports");
  const goals = data.goals ?? [];
  const rows =
    section === "budget"
      ? [
          {
            label: budgetLabel ?? t("budget"),
            value: formatMoney(data.budget.poolCents),
            filled: true,
          },
          {
            label: t("allocated"),
            value: formatMoney(
              Object.values(data.budget.allocations).reduce((sum, cents) => sum + cents, 0),
            ),
          },
          { label: t("spent"), value: formatMoney(data.summary.spendingCents) },
          {
            label: t("remaining"),
            value: formatMoney(data.budget.poolCents - data.summary.spendingCents),
          },
        ]
      : [
          {
            label: t("saved"),
            value: formatMoney(goals.reduce((sum, goal) => sum + goal.savedCents, 0)),
            filled: true,
          },
          {
            label: t("target"),
            value: formatMoney(goals.reduce((sum, goal) => sum + goal.targetCents, 0)),
          },
          { label: t("goals"), value: String(goals.length) },
          {
            label: t("reached"),
            value: String(
              goals.filter((goal) => goal.targetCents > 0 && goal.savedCents >= goal.targetCents)
                .length,
            ),
          },
        ];
  return (
    <div className="mb-[11px] grid grid-cols-2 gap-2 lg:hidden">
      {rows.map((row) => (
        <MobileReportStat key={row.label} {...row} />
      ))}
    </div>
  );
}
