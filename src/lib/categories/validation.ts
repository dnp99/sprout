/** Validation for creating a category. Pure — no DB access. */

export interface CategoryInput {
  name: string;
  emoji: string;
  color: string;
  monthlyBudgetCents: number;
}

export type CategoryValidationResult =
  { ok: true; value: CategoryInput } | { ok: false; errors: string[] };

export function validateCategory(body: unknown): CategoryValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("name is required");
  if (name.length > 60) errors.push("name must be 60 characters or fewer");

  const emoji = typeof input.emoji === "string" && input.emoji.trim() ? input.emoji.trim() : "🏷️";
  const color =
    typeof input.color === "string" && input.color.trim() ? input.color.trim() : "#c98a5a";

  let monthlyBudgetCents = 0;
  if (input.monthlyBudgetCents !== undefined) {
    if (
      typeof input.monthlyBudgetCents !== "number" ||
      !Number.isInteger(input.monthlyBudgetCents) ||
      input.monthlyBudgetCents < 0
    ) {
      errors.push("monthlyBudgetCents must be a non-negative integer");
    } else {
      monthlyBudgetCents = input.monthlyBudgetCents;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { name, emoji, color, monthlyBudgetCents } };
}
