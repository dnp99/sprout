/** Validation for creating/updating a recurring item. Pure — no DB access. */

import type { Cadence } from "@/lib/types";

export interface RecurringInput {
  name: string;
  emoji: string;
  /** Signed cents: negative = bill/expense, positive = income. */
  amountCents: number;
  cadence: Cadence;
  dayOfMonth: number;
  dayOfWeek: number | null;
  monthOfYear: number | null;
  paused: boolean;
  categoryId: string | null;
}

export type RecurringValidationResult =
  { ok: true; value: RecurringInput } | { ok: false; errors: string[] };

const CADENCES = new Set<Cadence>(["monthly", "weekly", "yearly"]);
const isInt = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

export function validateRecurring(body: unknown): RecurringValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("name is required");
  if (name.length > 80) errors.push("name must be 80 characters or fewer");

  const isIncome = typeof input.amountCents === "number" && input.amountCents > 0;
  const emoji =
    typeof input.emoji === "string" && input.emoji.trim()
      ? input.emoji.trim()
      : isIncome
        ? "💰"
        : "🧾";

  const amountCents = input.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents) || amountCents === 0) {
    errors.push("amountCents must be a non-zero integer");
  }

  const cadence = (input.cadence ?? "monthly") as Cadence;
  if (!CADENCES.has(cadence)) errors.push("cadence must be monthly, weekly or yearly");

  // Anchor requirements depend on cadence. day_of_month is always stored (NOT
  // NULL); it defaults to 1 for weekly, where it's unused.
  let dayOfMonth = 1;
  let dayOfWeek: number | null = null;
  let monthOfYear: number | null = null;

  if (cadence === "weekly") {
    if (!isInt(input.dayOfWeek, 0, 6)) errors.push("dayOfWeek must be between 0 and 6");
    else dayOfWeek = input.dayOfWeek as number;
  } else {
    if (!isInt(input.dayOfMonth, 1, 31)) errors.push("dayOfMonth must be between 1 and 31");
    else dayOfMonth = input.dayOfMonth as number;
    if (cadence === "yearly") {
      if (!isInt(input.monthOfYear, 1, 12)) errors.push("monthOfYear must be between 1 and 12");
      else monthOfYear = input.monthOfYear as number;
    }
  }

  const paused = input.paused === true;
  const categoryId =
    input.categoryId === undefined || input.categoryId === null || input.categoryId === ""
      ? null
      : String(input.categoryId);

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      emoji,
      amountCents: amountCents as number,
      cadence,
      dayOfMonth,
      dayOfWeek,
      monthOfYear,
      paused,
      categoryId,
    },
  };
}
