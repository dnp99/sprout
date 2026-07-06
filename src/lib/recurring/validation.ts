/** Validation for creating/updating a recurring item. Pure — no DB access. */

export interface RecurringInput {
  name: string;
  emoji: string;
  /** Signed cents: negative = bill/expense, positive = income. */
  amountCents: number;
  dayOfMonth: number;
  paused: boolean;
  categoryId: string | null;
}

export type RecurringValidationResult =
  { ok: true; value: RecurringInput } | { ok: false; errors: string[] };

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

  const dayOfMonth = input.dayOfMonth;
  if (
    typeof dayOfMonth !== "number" ||
    !Number.isInteger(dayOfMonth) ||
    dayOfMonth < 1 ||
    dayOfMonth > 31
  ) {
    errors.push("dayOfMonth must be between 1 and 31");
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
      dayOfMonth: dayOfMonth as number,
      paused,
      categoryId,
    },
  };
}
