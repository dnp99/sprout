import type { RecurringItem } from "@/lib/types";
import type { RecurringInput } from "./validation";

/** The editable fields of a recurring item, for PATCH payloads. */
export function toRecurringInput(item: RecurringItem): RecurringInput {
  return {
    name: item.name,
    emoji: item.emoji,
    amountCents: item.amountCents,
    dayOfMonth: item.dayOfMonth,
    paused: item.paused,
    categoryId: item.categoryId,
  };
}
