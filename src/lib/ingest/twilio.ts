import { createHmac } from "node:crypto";

/** Twilio WhatsApp webhook helpers (plan 008): request-signature verification,
 *  TwiML replies, and inbound-message command parsing. Pure + unit-tested. */

/** Canonical Twilio request signature: HMAC-SHA1 of (URL + POST params sorted by
 *  key and concatenated), keyed by the account auth token, base64-encoded.
 *  https://www.twilio.com/docs/usage/security#validating-requests */
export function computeTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
): string {
  let data = url;
  for (const key of Object.keys(params).sort()) data += key + params[key];
  return createHmac("sha1", authToken).update(data, "utf8").digest("base64");
}

/** Constant-time verify of an `X-Twilio-Signature` header against the request. */
export function verifyTwilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>,
  signature: string | null | undefined,
): boolean {
  if (!signature) return false;
  return safeEqual(computeTwilioSignature(authToken, url, params), signature);
}

/** Length-checked, constant-time string compare (avoids Buffer for es-compat). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const XML_ENTITIES: Record<string, string> = {
  "<": "&lt;",
  ">": "&gt;",
  "&": "&amp;",
  "'": "&apos;",
  '"': "&quot;",
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => XML_ENTITIES[c]);
}

/** A TwiML response carrying one (XML-escaped) reply message. */
export function twimlMessage(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
}

/** An empty TwiML response — acknowledge the webhook, send nothing back. */
export const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

/** An inbound WhatsApp message, classified. */
export type WhatsappCommand =
  | { kind: "link"; code: string }
  | { kind: "undo" }
  | { kind: "edit" }
  | { kind: "capture"; text: string };

/** Classify an inbound message: `link <code>` binds the phone to a user; a lone
 *  `U`/`E` acts on the last capture; anything else is a capture to log. */
export function parseWhatsappCommand(body: string): WhatsappCommand {
  const text = body.trim();
  const link = /^link\s+(\S+)/i.exec(text);
  if (link) return { kind: "link", code: link[1].toUpperCase() };
  if (/^u$/i.test(text)) return { kind: "undo" };
  if (/^e$/i.test(text)) return { kind: "edit" };
  return { kind: "capture", text };
}
