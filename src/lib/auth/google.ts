import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { validGoogleLinkIntent, type GoogleLinkIntent } from "./google-link";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

export const GOOGLE_FLOW_COOKIE =
  process.env.NODE_ENV === "production" ? "__Host-sprout_google" : "sprout_google";
export const GOOGLE_FLOW_SECONDS = 600;
export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const origin = process.env.GOOGLE_AUTH_ORIGIN;
  if (!clientId || !clientSecret || !origin) return null;
  const url = new URL(origin);
  if (
    url.origin !== origin ||
    (url.protocol !== "https:" &&
      !(process.env.NODE_ENV !== "production" && ["localhost", "127.0.0.1"].includes(url.hostname)))
  )
    throw new Error("Invalid Google authentication origin");
  return { clientId, clientSecret, origin, redirectUri: `${origin}/api/auth/google/callback` };
}
export function googleClient(config: NonNullable<ReturnType<typeof googleConfig>>) {
  return new OAuth2Client(config.clientId, config.clientSecret, config.redirectUri);
}
export type GoogleFlow = {
  state: string;
  nonce: string;
  verifier: string;
  createdAt: number;
  link?: GoogleLinkIntent;
};
export function newGoogleFlow(now = Date.now(), link?: GoogleLinkIntent): GoogleFlow {
  return {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    createdAt: now,
    ...(link ? { link } : {}),
  };
}
export function googleChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}
/** The browser-bound, short-lived cookie and PKCE verifier prevent unsolicited
 * callbacks/code injection. Consume the cookie before any network/database work. */
export function validateGoogleFlow(
  raw: string | undefined,
  state: string | null,
  now = Date.now(),
): ReturnType<typeof newGoogleFlow> | null {
  try {
    if (!raw || !state || raw.length > 2048) return null;
    const flow = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (
      ![flow.state, flow.nonce, flow.verifier].every(
        (v) => typeof v === "string" && /^[A-Za-z0-9_-]{43}$/.test(v),
      )
    )
      return null;
    if (
      typeof flow.createdAt !== "number" ||
      !(
        flow.createdAt > 0 &&
        now >= flow.createdAt &&
        now - flow.createdAt <= GOOGLE_FLOW_SECONDS * 1000
      )
    )
      return null;
    if (flow.link !== undefined && !validGoogleLinkIntent(flow.link)) return null;
    const a = Buffer.from(flow.state),
      b = Buffer.from(state);
    return a.length === b.length && timingSafeEqual(a, b) ? flow : null;
  } catch {
    return null;
  }
}
/** Signature, issuer, audience and expiry are verified by Google's library first.
 * Only the stable subject is an account identity; verified email is required. */
export function googleIdentity(payload: TokenPayload | undefined, nonce: string) {
  if (!payload?.sub || !payload.email || payload.email_verified !== true || payload.nonce !== nonce)
    throw new Error("Invalid Google identity");
  return {
    subject: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: (payload.name || payload.email).slice(0, 200),
  };
}

/** Authenticate the flow metadata as well as binding it to the browser. This
 * prevents a holder of a stolen session from forging a password-verified link
 * intent by editing their own cookie. Secret rotation invalidates pending flows. */
export function serializeGoogleFlow(flow: GoogleFlow, secret: string) {
  const value = Buffer.from(JSON.stringify(flow)).toString("base64url");
  const signature = createHmac("sha256", secret).update(value).digest("base64url");
  return `${value}.${signature}`;
}
export function readGoogleFlow(raw: string | undefined, state: string | null, secret: string) {
  if (!raw || raw.length > 2048) return null;
  const parts = raw.split(".");
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return null;
  const expected = createHmac("sha256", secret).update(parts[0]).digest("base64url");
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(parts[1]))) return null;
  return validateGoogleFlow(parts[0], state);
}
