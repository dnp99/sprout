import { formatMoney } from "@/lib/format";
import type { Goal } from "@/lib/types";

/** Savings-goal card (shared by mobile Goals and the web Goals grid). */
export function GoalCard({ goal }: { goal: Goal }) {
  const percent = goal.targetCents > 0 ? Math.round((goal.savedCents / goal.targetCents) * 100) : 0;
  return (
    <div className="rounded-card bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{goal.emoji}</span>
        <div className="flex-1">
          <div className="text-[15px] font-extrabold text-ink">{goal.name}</div>
          <div className="text-[11.5px] font-bold text-muted">{goal.targetLabel}</div>
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
        <span className="font-extrabold tabular-nums text-ink">{formatMoney(goal.savedCents)}</span>
        <span>of {formatMoney(goal.targetCents)}</span>
      </div>
    </div>
  );
}
