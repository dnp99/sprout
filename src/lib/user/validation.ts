/** Validation for a profile edit. Pure — no DB access. */

export interface ProfileUpdateInput {
  name: string;
  currency: string;
  budgetCycle: "monthly" | "weekly" | "biweekly";
}

export type ProfileValidationResult =
  { ok: true; value: ProfileUpdateInput } | { ok: false; errors: string[] };

const CYCLES = new Set(["monthly", "weekly", "biweekly"]);

export function validateProfileUpdate(body: unknown): ProfileValidationResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const errors: string[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) errors.push("name is required");
  if (name.length > 120) errors.push("name must be 120 characters or fewer");

  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  if (!currency || currency.length > 8) errors.push("currency is invalid");

  const cycle = typeof input.budgetCycle === "string" ? input.budgetCycle : "monthly";
  const budgetCycle = (CYCLES.has(cycle) ? cycle : "monthly") as ProfileUpdateInput["budgetCycle"];

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { name, currency, budgetCycle } };
}
