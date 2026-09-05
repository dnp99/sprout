/** Input validation for creating a transaction. Pure — no DB access. */

import type { TxnKind } from "../import/types";
import { normalizeOccurredAtInput } from "./occurredAt";

export interface CreateTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId?: string | null;
  incomeSourceId?: string | null;
  note?: string | null;
  method?: string;
  occurredAt?: string;
  /** Transaction type. In-app adds default to "expense"; ingest sets it from
   *  `classify`. Internal moves (transfer/payment) ride `excludeFromBudget`. */
  kind?: TxnKind;
  /** Keep this row out of budget/spending math (transfers, card/loan payments). */
  excludeFromBudget?: boolean;
  /** Idempotency / dedupe key for machine-created rows (import, channels). Null
   *  for manual in-app adds. */
  externalId?: string | null;
  /** Origin marker: null/'manual' = in-app, 'whatsapp' | 'siri' = capture.
   *  Set by the ingest write path (not from request bodies). */
  source?: string | null;
}

export type ValidationResult =
  { ok: true; value: CreateTransactionInput } | { ok: false; errors: string[] };

const ALLOWED_METHODS = new Set(["card", "cash", "transfer"]);
const ALLOWED_KINDS = new Set<TxnKind>(["expense", "income", "transfer", "payment"]);

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
  const incomeSourceId =
    input.incomeSourceId === undefined || input.incomeSourceId === null
      ? null
      : String(input.incomeSourceId);

  // Optional machine fields — default to a plain expense so the in-app add path
  // (which never sends these) is unchanged.
  let kind: TxnKind = "expense";
  if (input.kind !== undefined) {
    if (typeof input.kind !== "string" || !ALLOWED_KINDS.has(input.kind as TxnKind)) {
      errors.push(`kind must be one of ${[...ALLOWED_KINDS].join(", ")}`);
    } else {
      kind = input.kind as TxnKind;
    }
  }
  const excludeFromBudget = input.excludeFromBudget === true;
  const externalId =
    input.externalId === undefined || input.externalId === null ? null : String(input.externalId);

  if (errors.length > 0) return { ok: false, errors };

  let occurredAt: string | undefined;
  if (typeof input.occurredAt === "string" && input.occurredAt.trim()) {
    const normalized = normalizeOccurredAtInput(input.occurredAt);
    if (!normalized) errors.push("occurredAt must be a valid date");
    else occurredAt = normalized;
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      merchant,
      amountCents: amountCents as number,
      categoryId,
      incomeSourceId,
      note,
      method,
      occurredAt,
      kind,
      excludeFromBudget,
      externalId,
    },
  };
}

export interface UpdateTransactionInput {
  merchant: string;
  amountCents: number;
  categoryId: string | null;
  incomeSourceId: string | null;
  note: string | null;
  /** Keep this row out of budget/spending math (transfers, card/loan payments). */
  excludeFromBudget: boolean;
  /** New date (ISO / "YYYY-MM-DD"). Optional — omit to keep the existing date
   *  (the inline re-category path doesn't send it). */
  occurredAt?: string;
}

export type UpdateValidationResult =
  { ok: true; value: UpdateTransactionInput } | { ok: false; errors: string[] };

/** Validate an edit. Same field rules as create, minus method; occurredAt is
 *  optional (omit to keep the current date). */
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
  const incomeSourceId =
    input.incomeSourceId === undefined || input.incomeSourceId === null
      ? null
      : String(input.incomeSourceId);

  // Coerced to a plain boolean; the edit form always sends it.
  const excludeFromBudget = input.excludeFromBudget === true;

  // Optional new date. Normalize date-only input to a canonical ISO instant so
  // the edited calendar day survives timezone round-trips.
  let occurredAt: string | undefined;
  if (typeof input.occurredAt === "string" && input.occurredAt.trim()) {
    const normalized = normalizeOccurredAtInput(input.occurredAt);
    if (!normalized) errors.push("occurredAt must be a valid date");
    else occurredAt = normalized;
  }

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      merchant,
      amountCents: amountCents as number,
      categoryId,
      incomeSourceId,
      note,
      excludeFromBudget,
      occurredAt,
    },
  };
}
