import { aiParseCapture } from "./ai-parse";
import { parseCapture, type CaptureDraft } from "./parse";

/** Resolve a capture line to a draft: the deterministic regex first (instant,
 *  free), then the Haiku fallback only when the regex can't find an amount
 *  (e.g. Siri spells numbers as words). Shared by both capture channels so they
 *  parse identically. Degrades to the regex draft if the AI is unavailable. */
export async function resolveCapture(text: string, now = new Date()): Promise<CaptureDraft> {
  const draft = parseCapture(text, now);
  if (!draft.needsClarification && draft.amountCents !== 0) return draft;

  const ai = await aiParseCapture(text, now);
  if (!ai) return draft;
  return {
    merchant: ai.merchant,
    amountCents: ai.amountCents,
    occurredAt: ai.occurredAt ?? draft.occurredAt,
    confidence: 0.75,
    raw: text,
  };
}
