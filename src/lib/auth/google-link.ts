import { createHash } from "node:crypto";
import { SECTION_PATHS } from "@/lib/nav";

export type GoogleLinkIntent = { userId: string; sessionHash: string; returnPath: string };
/** Return only to known ledger pages; never let OAuth become an open redirect. */
export function googleLinkReturnPath(value: unknown): string {
  if (typeof value !== "string") return "/home";
  if (value === "/groups" || SECTION_PATHS.includes(value)) return value;
  return /^\/groups\/[a-f0-9-]{36}(?:\/(?:transactions|settings|trends|budget|goals|import|settlements|bills))?$/.test(
    value,
  )
    ? value
    : "/home";
}
/** Binding the intent to the exact opaque session prevents a callback linking
 * an account after logout, account switching, session expiry or revocation. */
export function googleSessionHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function validGoogleLinkIntent(value: unknown): value is GoogleLinkIntent {
  if (!value || typeof value !== "object") return false;
  const link = value as GoogleLinkIntent;
  return (
    typeof link.userId === "string" &&
    /^[a-f0-9-]{36}$/i.test(link.userId) &&
    typeof link.sessionHash === "string" &&
    /^[a-f0-9]{64}$/.test(link.sessionHash) &&
    typeof link.returnPath === "string" &&
    googleLinkReturnPath(link.returnPath) === link.returnPath
  );
}
