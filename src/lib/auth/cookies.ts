import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionCookieOptions } from "./session";

/** Session-cookie helpers for route handlers (server-only). */

export async function setSessionCookie(token: string, expires: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions(expires));
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function readSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}
