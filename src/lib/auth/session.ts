import { randomBytes } from "node:crypto";

/** Session cookie name + token/expiry helpers. The cookie holds an opaque
 *  token; the session row is the source of truth server-side. */

export const SESSION_COOKIE = "sprout_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export function sessionExpiry(from = new Date()): Date {
  return new Date(from.getTime() + SESSION_DURATION_MS);
}

/** Cookie attributes for `cookies().set(...)`. */
export function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}
