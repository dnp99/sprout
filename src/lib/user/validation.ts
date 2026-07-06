/** Validation for a profile edit. Pure — no DB access. Partial: only the fields
 *  present in the body are validated and returned, so callers can update just
 *  one thing (e.g. the budget pool) without touching the rest. */

export interface ProfilePatch {
  name?: string;
  currency?: string;
  budgetCycle?: "monthly" | "weekly" | "biweekly";
  budgetPoolCents?: number;
}

export type ProfileValidationResult =
  { ok: true; value: ProfilePatch } | { ok: false; errors: string[] };

const CYCLES = new Set(["monthly", "weekly", "biweekly"]);

export function validateProfileUpdate(body: unknown): ProfileValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];
  const patch: ProfilePatch = {};

  if (input.name !== undefined) {
    const name = typeof input.name === "string" ? input.name.trim() : "";
    if (!name) errors.push("name is required");
    else if (name.length > 120) errors.push("name must be 120 characters or fewer");
    else patch.name = name;
  }

  if (input.currency !== undefined) {
    const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
    if (!currency || currency.length > 8) errors.push("currency is invalid");
    else patch.currency = currency;
  }

  if (input.budgetCycle !== undefined) {
    const cycle = String(input.budgetCycle);
    if (!CYCLES.has(cycle)) errors.push("budgetCycle is invalid");
    else patch.budgetCycle = cycle as ProfilePatch["budgetCycle"];
  }

  if (input.budgetPoolCents !== undefined) {
    const cents = input.budgetPoolCents;
    if (typeof cents !== "number" || !Number.isInteger(cents) || cents < 0) {
      errors.push("budgetPoolCents must be a non-negative integer");
    } else {
      patch.budgetPoolCents = cents;
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: patch };
}
