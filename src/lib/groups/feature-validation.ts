import type { GoalInput } from "@/lib/goals/validation";
import { validateGoal } from "@/lib/goals/validation";
import type { RecurringInput } from "@/lib/recurring/validation";
import { validateRecurring } from "@/lib/recurring/validation";
import { cents, date, GroupError, id, object } from "./validation";

export type FeatureOperation =
  | { type: "goal"; id?: string; value: GoalInput }
  | { type: "goalDelete"; id: string }
  | { type: "recurring"; id?: string; value: RecurringInput }
  | { type: "recurringDelete"; id: string }
  | { type: "recurringPaid"; id: string; dueDate: string }
  | { type: "roundupSweep" };

/** Reuse personal validators, adding storage bounds and group-safe identities. */
export function parseFeatureOperation(body: Record<string, unknown>): FeatureOperation {
  const type = body.type;
  if (type === "roundupSweep") return { type };
  if (type === "goalDelete" || type === "recurringDelete") return { type, id: id(body.id) };
  if (type === "recurringPaid") return { type, id: id(body.id), dueDate: date(body.dueDate) };
  const value = object(body.value),
    key = body.id === undefined ? undefined : id(body.id);
  if (type === "goal") {
    const result = validateGoal(value);
    if (!result.ok) throw new GroupError(result.errors.join(" "));
    cents(result.value.targetCents);
    cents(result.value.savedCents, true);
    if (result.value.targetDate) date(result.value.targetDate);
    return { type, id: key, value: result.value };
  }
  if (type === "recurring") {
    const result = validateRecurring(value);
    if (!result.ok) throw new GroupError(result.errors.join(" "));
    cents(Math.abs(result.value.amountCents));
    if (result.value.categoryId) id(result.value.categoryId);
    return { type, id: key, value: result.value };
  }
  throw new GroupError("Unknown plan action.");
}
