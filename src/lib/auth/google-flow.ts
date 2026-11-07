import { cookies } from "next/headers";
import { CodeChallengeMethod } from "google-auth-library";
import {
  googleClient,
  newGoogleFlow,
  serializeGoogleFlow,
  googleChallenge,
  GOOGLE_FLOW_COOKIE,
  GOOGLE_FLOW_SECONDS,
  type googleConfig,
} from "./google";
import type { GoogleLinkIntent } from "./google-link";

/** Sign-in and explicit linking share the same browser-bound OAuth safeguards. */
export async function beginGoogleFlow(
  config: NonNullable<ReturnType<typeof googleConfig>>,
  link?: GoogleLinkIntent,
) {
  const flow = newGoogleFlow(Date.now(), link);
  (await cookies()).set(GOOGLE_FLOW_COOKIE, serializeGoogleFlow(flow, config.clientSecret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_FLOW_SECONDS,
  });
  return googleClient(config).generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: googleChallenge(flow.verifier),
    code_challenge_method: CodeChallengeMethod.S256,
    prompt: "select_account",
  });
}
