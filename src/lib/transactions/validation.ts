/** Input validation for creating a transaction. Pure — no DB access. */

export interface CreateTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId?: string | null;
  note?: string | null;
  method?: string;
  occurredAt?: string;
}

export type ValidationResult =
  { ok: true; value: CreateTransactionInput } | { ok: false; errors: string[] };

const ALLOWED_METHODS = new Set(["card", "cash", "transfer"]);

export function validateCreateTransaction(body: unknown): ValidationResult {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;

  const merchant = typeof input.merchant === "string" ? input.merchant.trim() : "";
  if (!merchant) errors.push("merchant is required");
  if (merchant.length > 120) errors.push("merchant must be 120 characters or fewer");

  const amountCents = input.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) {
    errors.push("amountCents must be an integer number of cents");
  } else if (amountCents === 0) {
    errors.push("amountCents must not be zero");
  }

  let method = "card";
  if (input.method !== undefined) {
    if (typeof input.method !== "string" || !ALLOWED_METHODS.has(input.method)) {
      errors.push(`method must be one of ${[...ALLOWED_METHODS].join(", ")}`);
    } else {
      method = input.method;
    }
  }

  const note = input.note === undefined || input.note === null ? null : String(input.note).trim();
  if (note && note.length > 280) errors.push("note must be 280 characters or fewer");

  const categoryId =
    input.categoryId === undefined || input.categoryId === null ? null : String(input.categoryId);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      merchant,
      amountCents: amountCents as number,
      categoryId,
      note,
      method,
      occurredAt: typeof input.occurredAt === "string" ? input.occurredAt : undefined,
    },
  };
}

export interface UpdateTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId: string | null;
  note: string | null;
  /** Keep this row out of budget/spending math (transfers, card/loan payments). */
  excludeFromBudget: boolean;
}

export type UpdateValidationResult =
  { ok: true; value: UpdateTransactionInput } | { ok: false; errors: string[] };

/** Validate an edit. Same field rules as create, minus method/occurredAt
 *  (those aren't editable here). */
export function validateUpdateTransaction(body: unknown): UpdateValidationResult {
  const errors: string[] = [];
  const input = (body ?? {}) as Record<string, unknown>;

  const merchant = typeof input.merchant === "string" ? input.merchant.trim() : "";
  if (!merchant) errors.push("merchant is required");
  if (merchant.length > 120) errors.push("merchant must be 120 characters or fewer");

  const amountCents = input.amountCents;
  if (typeof amountCents !== "number" || !Number.isInteger(amountCents)) {
    errors.push("amountCents must be an integer number of cents");
  } else if (amountCents === 0) {
    errors.push("amountCents must not be zero");
  }

  const note = input.note === undefined || input.note === null ? null : String(input.note).trim();
  if (note && note.length > 280) errors.push("note must be 280 characters or fewer");

  const categoryId =
    input.categoryId === undefined || input.categoryId === null ? null : String(input.categoryId);

  // Coerced to a plain boolean; the edit form always sends it.
  const excludeFromBudget = input.excludeFromBudget === true;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { merchant, amountCents: amountCents as number, categoryId, note, excludeFromBudget },
  };
}
