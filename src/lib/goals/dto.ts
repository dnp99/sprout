import type { GoalRow } from "@/db/schema";
import type { Goal } from "@/lib/types";

/** Derived progress label for a goal: reached / almost there / target month. */
export function goalTargetLabel(
  savedCents: number,
  targetCents: number,
  targetDate: string | null,
): string {
  const pct = targetCents > 0 ? savedCents / targetCents : 0;
  if (pct >= 1) return "Reached!";
  if (pct >= 0.8) return "Almost there!";
  if (targetDate) {
    return new Date(`${targetDate}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }
  return "";
}

export function toGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    color: row.color,
    savedCents: row.savedCents,
    targetCents: row.targetCents,
    targetLabel: goalTargetLabel(row.savedCents, row.targetCents, row.targetDate),
  };
}
