import type { RecurringItemRow } from "@/db/schema";
import { recurringFrequencyLabel } from "@/lib/bills";
import type { RecurringItem } from "@/lib/types";

export function toRecurringItem(row: RecurringItemRow): RecurringItem {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    amountCents: row.amountCents,
    dayOfMonth: row.dayOfMonth,
    frequencyLabel: recurringFrequencyLabel(row.cadence, row.dayOfMonth),
    paused: row.paused,
    isIncome: row.amountCents > 0,
  };
}
