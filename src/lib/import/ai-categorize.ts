import Anthropic from "@anthropic-ai/sdk";

/** AI categorization fallback (plan 002, slice 6).
 *
 *  Given merchant names that no static map or cached merchant rule could
 *  categorize, ask Claude to sort each into one of the user's own Sprout
 *  categories (or "none"). Results are cached as merchant rules by the caller,
 *  so this is a one-time cost per merchant. Best-effort: any failure (missing
 *  key, API error) resolves to an empty map and the rows import uncategorized.
 */

// Cheap, high-volume classification runs on Haiku (same model the navigate-easy
// route advisor uses) — the user pays per unique merchant once, then it's cached.
const MODEL = "claude-haiku-4-5";
// Bound each request so a large first import can't produce an oversized prompt
// or response; merchants beyond a batch are classified in the next call.
const BATCH = 100;
const SENTINEL_NONE = "none";

const SYSTEM_PROMPT =
  "You are a budgeting assistant that sorts merchant names into a user's " +
  "spending categories. Use only the provided category names. If a merchant " +
  `does not clearly belong to any of them, answer "${SENTINEL_NONE}". ` +
  "Judge from the merchant name alone; do not invent categories.";

/** Classify merchants into category names. Returns only confident matches
 *  (a merchant maps to one of `categoryNames`); anything the model marks
 *  "none" or leaves out is omitted. Never throws — returns {} on any failure. */
export async function categorizeMerchants(
  merchants: string[],
  categoryNames: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  if (merchants.length === 0 || categoryNames.length === 0) return result;
  if (!process.env.ANTHROPIC_API_KEY) return result;

  const client = new Anthropic();
  const allowed = new Set(categoryNames);
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["assignments"],
    properties: {
      assignments: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["merchant", "category"],
          properties: {
            merchant: { type: "string" },
            category: { type: "string", enum: [...categoryNames, SENTINEL_NONE] },
          },
        },
      },
    },
  };

  try {
    for (let i = 0; i < merchants.length; i += BATCH) {
      const batch = merchants.slice(i, i + BATCH);
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 8192,
        // Simple classification — no thinking needed; the JSON-schema constraint
        // keeps the output clean.
        output_config: { format: { type: "json_schema", schema } },
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content:
              `Categories: ${categoryNames.join(", ")}\n\n` +
              `Assign each of these merchants to one category (or "${SENTINEL_NONE}"):\n` +
              batch.map((m) => `- ${m}`).join("\n"),
          },
        ],
      });

      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") continue;
      const parsed = JSON.parse(text.text) as {
        assignments?: { merchant?: string; category?: string }[];
      };
      for (const a of parsed.assignments ?? []) {
        if (a.merchant && a.category && allowed.has(a.category)) {
          result.set(a.merchant, a.category);
        }
      }
    }
  } catch (error) {
    // Best-effort: log and fall back to whatever matched so far.
    console.error("AI categorization failed (importing uncategorized):", error);
  }

  return result;
}
