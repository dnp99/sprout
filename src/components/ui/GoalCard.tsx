"use client";

import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import type { Goal } from "@/lib/types";

/** Savings-goal card (shared by mobile Goals and the web Goals grid). Renders as
 *  a button when `onClick` is passed (opens the editor). */
export function GoalCard({ goal, onClick }: { goal: Goal; onClick?: () => void }) {
  const t = useTranslations("goals.card");
  const fmt = useFormatters();
  const percent = goal.targetCents > 0 ? Math.round((goal.savedCents / goal.targetCents) * 100) : 0;

  // Progress label, rebuilt locale-aware from the goal's raw fields (the DTO's
  // derived `targetLabel` is English-only): reached / almost there / target month.
  const pct = goal.targetCents > 0 ? goal.savedCents / goal.targetCents : 0;
  let label = "";
  if (pct >= 1) label = t("reached");
  else if (pct >= 0.8) label = t("almostThere");
  else if (goal.targetDate) {
    const [y, m] = goal.targetDate.split("-").map(Number);
    if (y && m) label = fmt.shortMonthYear(new Date(Date.UTC(y, m - 1, 1)));
  }

  const body = (
    <>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{goal.emoji}</span>
        <div className="flex-1">
          <div className="text-[15px] font-extrabold text-ink">{goal.name}</div>
          <div className="text-[11.5px] font-bold text-muted">{label}</div>
        </div>
        <span className="text-xs font-bold text-muted">{percent}%</span>
      </div>
      <div className="mt-3.5 h-2.5 overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full"
          style={{ width: `${percent}%`, background: goal.color }}
        />
      </div>
      <div className="mt-2.5 flex justify-between text-[12.5px] font-semibold text-muted">
        <span className="font-extrabold tabular-nums text-ink">{fmt.money(goal.savedCents)}</span>
        <span>{t("of", { amount: fmt.money(goal.targetCents) })}</span>
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full rounded-card bg-card p-5 text-left">
        {body}
      </button>
    );
  }
  return <div className="rounded-card bg-card p-5">{body}</div>;
}
