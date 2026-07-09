/** Credential validation for signup/login. Pure — no DB access. */

export interface Credentials {
  email: string;
  password: string;
  name?: string;
}

export type CredentialResult = { ok: true; value: Credentials } | { ok: false; error: string };

// Exported so the client auth form can validate inline with the *same* rules the
// server enforces (no drift between the two). Pure regex/number — safe to import
// into a client component.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

export function validateCredentials(body: unknown, requireName = false): CredentialResult {
  const input = (body ?? {}) as Record<string, unknown>;
  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input.password === "string" ? input.password : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";

  if (!EMAIL_RE.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
  }
  if (requireName && name.length > 60) {
    return { ok: false, error: "Name must be 60 characters or fewer." };
  }

  // Fall back to the email's local part as a display name.
  const resolvedName = name || deriveName(email);
  return { ok: true, value: { email, password, name: resolvedName } };
}

function deriveName(email: string): string {
  const local = email
    .split("@")[0]
    .replace(/[._-]+/g, " ")
    .trim();
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "Friend";
}
