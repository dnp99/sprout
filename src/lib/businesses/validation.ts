/** Pure boundary validation for user-owned Businesses (plan 020). */
export interface BusinessInput {
  name: string;
  emoji: string;
  color: string;
}

export function validateBusiness(
  body: unknown,
): { ok: true; value: BusinessInput } | { ok: false; errors: string[] } {
  const input = (body ?? {}) as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const errors = !name
    ? ["name is required"]
    : name.length > 60
      ? ["name must be 60 characters or fewer"]
      : [];
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      emoji: typeof input.emoji === "string" && input.emoji.trim() ? input.emoji.trim() : "💼",
      color: typeof input.color === "string" && input.color.trim() ? input.color.trim() : "#c98a5a",
    },
  };
}
