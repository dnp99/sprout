import { resolveApiToken } from "@/lib/ingest/auth";
import { ingestTransaction } from "@/lib/ingest/ingest";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { validateCreateTransaction } from "@/lib/transactions/validation";

/**
 * POST /api/ingest — **structured** capture for a "typed fields" Shortcut / any
 * script. Bearer-authed (not a cookie session). Body is the same shape as the
 * in-app create; we still run the ingest write path (classify → resolve →
 * create), so a typed transfer isn't counted as spend.
 *
 * Send an `Idempotency-Key` header (a UUID) to make retries a no-op.
 */
export async function POST(request: Request) {
  try {
    const userId = await resolveApiToken(request.headers.get("authorization"));
    if (!userId) return unauthorized("Invalid or missing bearer token.");

    const body = await request.json().catch(() => null);
    const validation = validateCreateTransaction(body);
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);

    const key = request.headers.get("idempotency-key");
    const transaction = await ingestTransaction(userId, {
      merchant: validation.value.merchant,
      amountCents: validation.value.amountCents,
      categoryId: validation.value.categoryId ?? null,
      note: validation.value.note ?? null,
      occurredAt: validation.value.occurredAt,
      externalId: key ? `siri:${key}` : (validation.value.externalId ?? null),
      source: "siri",
    });
    return ok({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ingest failed:", error);
    return serverError();
  }
}
