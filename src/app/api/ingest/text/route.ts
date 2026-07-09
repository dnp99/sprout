import { resolveApiToken } from "@/lib/ingest/auth";
import { ingestTransaction } from "@/lib/ingest/ingest";
import { parseCapture } from "@/lib/ingest/parse";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

/**
 * POST /api/ingest/text — **natural language** capture ("spent 12 on lunch").
 * Bearer-authed. Parses the line, then runs the ingest write path (classify →
 * resolve → create). Write-first: the row exists on return, so the caller shows
 * a *review* card with undo/edit — `confidence` just tells it how loudly to say
 * "check this". This is the Siri dictation path. See plans/008.
 *
 * Send an `Idempotency-Key` header (a UUID) to make retries a no-op.
 */
export async function POST(request: Request) {
  try {
    const userId = await resolveApiToken(request.headers.get("authorization"));
    if (!userId) return unauthorized("Invalid or missing bearer token.");

    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text : "";
    if (!text.trim()) return badRequest("text is required.");

    const draft = parseCapture(text);
    // Nothing to log yet — no amount found. The channel should ask, not guess.
    if (draft.needsClarification || draft.amountCents === 0) {
      return badRequest("Couldn't find an amount to log.", { draft });
    }

    const key = request.headers.get("idempotency-key");
    const transaction = await ingestTransaction(userId, {
      merchant: draft.merchant,
      amountCents: draft.amountCents,
      occurredAt: draft.occurredAt,
      externalId: key ? `siri:${key}` : null,
      source: "siri",
    });
    return ok({ transaction, confidence: draft.confidence }, { status: 201 });
  } catch (error) {
    console.error("POST /api/ingest/text failed:", error);
    return serverError();
  }
}
