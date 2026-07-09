import { classify } from "@/lib/import/classify";
import { createTransaction, findTransactionByExternalId } from "@/lib/transactions/repository";
import type { Transaction } from "@/lib/types";
import { resolveMerchantCategory } from "./resolve";

/** One capture, ready to write. The **sign of `amountCents`** carries income-vs-
 *  expense; `classify` (below) is the single source of truth for kind/exclude. */
export interface IngestInput {
  merchant: string;
  /** Signed integer cents. */
  amountCents: number;
  /** Optional explicit category (structured ingest); else resolved unless excluded. */
  categoryId?: string | null;
  note?: string | null;
  occurredAt?: string;
  /** Idempotency key (Shortcut UUID / Twilio MessageSid) → external_id. */
  externalId?: string | null;
  /** Origin marker for CSV reconciliation: 'siri' | 'whatsapp'. */
  source: string;
}

/** The write path shared by every capture channel (structured API, NL text,
 *  WhatsApp): classify → resolve category (unless the row is an internal move)
 *  → create. Idempotent — a retry with the same `externalId` returns the
 *  existing row instead of writing a duplicate. See plans/008. */
export async function ingestTransaction(userId: string, input: IngestInput): Promise<Transaction> {
  // Retry guard: same key → no-op (the partial unique index also enforces this).
  if (input.externalId) {
    const existing = await findTransactionByExternalId(userId, input.externalId);
    if (existing) return existing;
  }

  // classify owns kind + excludeFromBudget (transfers / card payments), exactly
  // like import — so an internal move isn't logged as normal spending.
  const { kind, excludeFromBudget } = classify(null, input.amountCents, input.merchant);

  // Internal moves stay uncategorized, same as import; otherwise resolve.
  let categoryId = input.categoryId ?? null;
  if (!excludeFromBudget && !categoryId) {
    categoryId = await resolveMerchantCategory(userId, input.merchant);
  }

  return createTransaction(userId, {
    merchant: input.merchant,
    amountCents: input.amountCents,
    categoryId,
    note: input.note ?? null,
    occurredAt: input.occurredAt,
    kind,
    excludeFromBudget,
    externalId: input.externalId ?? null,
    source: input.source,
  });
}
