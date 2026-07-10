import Anthropic from "@anthropic-ai/sdk";

/** Haiku fallback for the NL capture parser (plan 008). The deterministic regex
 *  in `parse.ts` only recognizes digits, but Siri dictations spell numbers as
 *  words ("McDonald's five dollars"). When the regex can't find an amount, ask
 *  Haiku to extract merchant + signed cents. Best-effort: no key / API error /
 *  no amount → null, and the caller keeps the regex result. Never throws. */

const MODEL = "claude-haiku-4-5";

export interface AiCapture {
  merchant: string;
  /** Signed integer cents (negative expense, positive income). */
  amountCents: number;
  /** ISO date ("2026-07-09") if a day was named, else undefined. */
  occurredAt?: string;
}

export async function aiParseCapture(text: string, now = new Date()): Promise<AiCapture | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  const today = isoDate(now);

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["found", "merchant", "amountCents"],
    properties: {
      found: { type: "boolean" },
      merchant: { type: "string" },
      // Signed integer cents.
      amountCents: { type: "integer" },
      occurredAt: { type: "string" }, // YYYY-MM-DD
    },
  };

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      output_config: { format: { type: "json_schema", schema } },
      system:
        "Extract a single transaction from a short spoken or typed note. " +
        "`amountCents` is INTEGER cents, SIGNED: negative for spending, positive " +
        "for income (paid, salary, refund, deposit, reimbursed). Understand " +
        "spelled-out amounts: 'five dollars' = 500, 'twelve fifty' = 1250, " +
        "'twenty bucks' = 2000, 'a hundred' = 10000. `merchant` is the place or " +
        "short description, title-cased. Resolve relative dates against today " +
        `(${today}) into occurredAt (YYYY-MM-DD); omit occurredAt if no date is ` +
        "mentioned. If no amount can be determined, set found=false.",
      messages: [{ role: "user", content: text }],
    });

    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") return null;
    const parsed = JSON.parse(block.text) as {
      found?: boolean;
      merchant?: string;
      amountCents?: number;
      occurredAt?: string;
    };
    if (!parsed.found || !parsed.merchant) return null;
    if (typeof parsed.amountCents !== "number" || !Number.isInteger(parsed.amountCents))
      return null;
    if (parsed.amountCents === 0) return null;
    return {
      merchant: parsed.merchant,
      amountCents: parsed.amountCents,
      occurredAt: typeof parsed.occurredAt === "string" ? parsed.occurredAt : undefined,
    };
  } catch (error) {
    console.error("AI capture parse failed (keeping regex result):", error);
    return null;
  }
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
