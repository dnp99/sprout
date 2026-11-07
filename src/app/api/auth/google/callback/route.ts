import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  googleConfig,
  googleClient,
  validateGoogleFlow,
  googleIdentity,
  GOOGLE_FLOW_COOKIE,
} from "@/lib/auth/google";
import { googleAccount, GoogleAccountExists } from "@/lib/auth/google-account";
import { createSession } from "@/lib/auth/sessionRepository";
import { setSessionCookie } from "@/lib/auth/cookies";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const config = googleConfig();
  if (!config)
    return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const store = await cookies();
  const params = new URL(request.url).searchParams;
  const flow = validateGoogleFlow(store.get(GOOGLE_FLOW_COOKIE)?.value, params.get("state"));
  store.delete(GOOGLE_FLOW_COOKIE);
  const fail = (reason: string) => {
    const response = NextResponse.redirect(`${config.origin}/login?google_error=${reason}`);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (!flow || params.getAll("state").length !== 1) return fail("failed");
  if (params.has("error")) return fail("cancelled");
  const code = params.get("code");
  if (!code || params.getAll("code").length !== 1) return fail("failed");
  try {
    const client = googleClient(config);
    const { tokens } = await client.getToken({
      code,
      codeVerifier: flow.verifier,
      redirect_uri: config.redirectUri,
    });
    if (!tokens.id_token) return fail("failed");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.clientId,
    });
    const user = await googleAccount(googleIdentity(ticket.getPayload(), flow.nonce));
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    const response = NextResponse.redirect(`${config.origin}/home`);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    // OAuth codes, tokens, claims and provider error payloads must not enter logs.
    return fail(error instanceof GoogleAccountExists ? "existing" : "failed");
  }
}
