import { resolveChannelUser } from "@/lib/ingest/auth";
import { resolveCapture } from "@/lib/ingest/capture";
import { ingestTransaction } from "@/lib/ingest/ingest";
import {
  clearLastIngest,
  getLastIngest,
  redeemLinkCode,
  stampLastIngest,
} from "@/lib/ingest/repository";
import {
  EMPTY_TWIML,
  parseWhatsappCommand,
  twimlMessage,
  verifyTwilioSignature,
} from "@/lib/ingest/twilio";
import { deleteTransaction } from "@/lib/transactions/repository";
import { formatMoney } from "@/lib/format";

/**
 * Twilio WhatsApp webhook (plan 008). Public endpoint — every request is
 * signature-verified against the account auth token before we act. Twilio POSTs
 * `application/x-www-form-urlencoded` (From, Body, MessageSid, …); we reply with
 * TwiML. Write-first: a capture is logged immediately, then the reply is a
 * *review* offering undo/edit.
 */

const CHANNEL = "whatsapp";

function xml(body: string) {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/xml; charset=utf-8" },
  });
}

/** The exact URL Twilio signed. Behind a tunnel/proxy, reconstruct from the
 *  forwarded headers; `TWILIO_WEBHOOK_URL` overrides when they can't be trusted. */
function signedUrl(request: Request): string {
  if (process.env.TWILIO_WEBHOOK_URL) return process.env.TWILIO_WEBHOOK_URL;
  const h = request.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const { pathname, search } = new URL(request.url);
  return `${proto}://${host}${pathname}${search}`;
}

export async function POST(request: Request) {
  try {
    const raw = await request.text();
    const params = Object.fromEntries(new URLSearchParams(raw));

    // Verify it's really Twilio (public endpoint) — reject anything unsigned or
    // misconfigured (fail closed).
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const signature = request.headers.get("x-twilio-signature");
    if (!authToken || !verifyTwilioSignature(authToken, signedUrl(request), params, signature)) {
      return new Response("Forbidden", { status: 403 });
    }

    const from = (params.From ?? "").replace(/^whatsapp:/i, ""); // E.164 phone
    const body = params.Body ?? "";
    const messageSid = params.MessageSid ?? "";
    if (!from) return xml(EMPTY_TWIML);

    const cmd = parseWhatsappCommand(body);

    // Linking doesn't need an existing identity — it creates one.
    if (cmd.kind === "link") {
      const userId = await redeemLinkCode(cmd.code, CHANNEL, from);
      return xml(
        twimlMessage(
          userId
            ? 'Connected ✅  Text me an expense like "coffee 4.50".'
            : "That link code didn't work — grab a fresh one in Sprout → Settings → Connected apps.",
        ),
      );
    }

    const userId = await resolveChannelUser(CHANNEL, from);
    if (!userId) {
      return xml(
        twimlMessage(
          "Text  link SPRT-XXXX  to connect — get your code in Sprout → Settings → Connected apps.",
        ),
      );
    }

    // Undo/edit act on the last capture via the per-identity pointer.
    if (cmd.kind === "undo") {
      const id = await getLastIngest(CHANNEL, from);
      if (!id) return xml(twimlMessage("Nothing recent to undo."));
      await deleteTransaction(userId, id);
      await clearLastIngest(CHANNEL, from);
      return xml(twimlMessage("Undone ✅"));
    }
    if (cmd.kind === "edit") {
      const base = process.env.NEXT_PUBLIC_APP_URL;
      return xml(
        twimlMessage(base ? `Edit it here: ${base}/transactions` : "Edit it in the Sprout app."),
      );
    }

    // Capture — write-first, idempotent on the message id.
    const draft = await resolveCapture(cmd.text);
    if (draft.needsClarification || draft.amountCents === 0) {
      return xml(twimlMessage('I couldn\'t find an amount — try "coffee 4.50".'));
    }
    const txn = await ingestTransaction(userId, {
      merchant: draft.merchant,
      amountCents: draft.amountCents,
      occurredAt: draft.occurredAt,
      externalId: `whatsapp:${messageSid}`,
      source: CHANNEL,
    });
    await stampLastIngest(CHANNEL, from, txn.id);
    return xml(
      twimlMessage(
        `Logged ${formatMoney(txn.amountCents)} · ${txn.merchant} · ${txn.categoryName} ✅ — reply U to undo, E to edit.`,
      ),
    );
  } catch (error) {
    console.error("POST /api/webhooks/whatsapp failed:", error);
    // Reply softly rather than 500 → no Twilio retry storm (the capture, if it
    // wrote, is idempotent on the message id anyway).
    return xml(twimlMessage("Something went wrong logging that — please try again."));
  }
}
