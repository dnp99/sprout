/** Validation for creating/updating a savings goal. Pure — no DB access. */

export interface GoalInput {
  name: string;
  emoji: string;
  color: string;
  targetCents: number;
  savedCents: number;
  targetDate: string | null;
}

export type GoalValidationResult = { ok: true; value: GoalInput } | { ok: false; errors: string[] };

export function validateGoal(body: unknown): GoalValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("name is required");
  if (name.length > 80) errors.push("name must be 80 characters or fewer");

  const emoji = typeof input.emoji === "string" && input.emoji.trim() ? input.emoji.trim() : "🎯";
  const color =
    typeof input.color === "string" && input.color.trim() ? input.color.trim() : "#e7a34a";

  const targetCents = input.targetCents;
  if (typeof targetCents !== "number" || !Number.isInteger(targetCents) || targetCents <= 0) {
    errors.push("targetCents must be a positive integer");
  }

  let savedCents = 0;
  if (input.savedCents !== undefined) {
    if (
      typeof input.savedCents !== "number" ||
      !Number.isInteger(input.savedCents) ||
      input.savedCents < 0
    ) {
      errors.push("savedCents must be a non-negative integer");
    } else {
      savedCents = input.savedCents;
    }
  }

  // Accept "YYYY-MM-DD" or null/empty.
  let targetDate: string | null = null;
  if (input.targetDate !== undefined && input.targetDate !== null && input.targetDate !== "") {
    const d = String(input.targetDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) errors.push("targetDate must be YYYY-MM-DD");
    else targetDate = d;
  }

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, emoji, color, targetCents: targetCents as number, savedCents, targetDate },
  };
}
