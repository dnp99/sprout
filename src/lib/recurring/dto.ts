import type { RecurringItemRow } from "@/db/schema";
import { recurringFrequencyLabel } from "@/lib/bills";
import type { Cadence, RecurringItem } from "@/lib/types";

export function toRecurringItem(row: RecurringItemRow): RecurringItem {
  const cadence = (row.cadence as Cadence) ?? "monthly";
  const schedule = {
    cadence,
    dayOfMonth: row.dayOfMonth,
    dayOfWeek: row.dayOfWeek,
    monthOfYear: row.monthOfYear,
  };
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    amountCents: row.amountCents,
    cadence,
    dayOfMonth: row.dayOfMonth,
    dayOfWeek: row.dayOfWeek,
    monthOfYear: row.monthOfYear,
    categoryId: row.categoryId,
    frequencyLabel: recurringFrequencyLabel(schedule),
    paused: row.paused,
    isIncome: row.amountCents > 0,
  };
}
