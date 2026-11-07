import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  googleConfig,
  googleClient,
  readGoogleFlow,
  googleIdentity,
  GOOGLE_FLOW_COOKIE,
} from "@/lib/auth/google";
import {
  googleAccount,
  GoogleAccountExists,
  linkGoogleAccount,
  GoogleLinkError,
} from "@/lib/auth/google-account";
import { createSession } from "@/lib/auth/sessionRepository";
import { getSessionUser } from "@/lib/auth/currentUser";
import { googleSessionHash } from "@/lib/auth/google-link";
import { setSessionCookie, readSessionToken } from "@/lib/auth/cookies";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const config = googleConfig();
  if (!config)
    return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const store = await cookies();
  const params = new URL(request.url).searchParams;
  const flow = readGoogleFlow(
    store.get(GOOGLE_FLOW_COOKIE)?.value,
    params.get("state"),
    config.clientSecret,
  );
  store.delete(GOOGLE_FLOW_COOKIE);
  const resultRedirect = (reason: string) => {
    const response = NextResponse.redirect(
      flow?.link
        ? `${config.origin}${flow.link.returnPath}?google_link=${reason}`
        : `${config.origin}/login?google_error=${reason}`,
    );
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (!flow || params.getAll("state").length !== 1) return resultRedirect("failed");
  if (params.has("error")) return resultRedirect("cancelled");
  const code = params.get("code");
  if (!code || params.getAll("code").length !== 1) return resultRedirect("failed");
  try {
    const client = googleClient(config);
    const { tokens } = await client.getToken({
      code,
      codeVerifier: flow.verifier,
      redirect_uri: config.redirectUri,
    });
    if (!tokens.id_token) return resultRedirect("failed");
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.clientId,
    });
    const identity = googleIdentity(ticket.getPayload(), flow.nonce);
    if (flow.link) {
      const current = await getSessionUser();
      const token = await readSessionToken();
      if (
        !current ||
        current.id !== flow.link.userId ||
        !token ||
        googleSessionHash(token) !== flow.link.sessionHash
      )
        return resultRedirect("failed");
      await linkGoogleAccount(current.id, identity);
      return resultRedirect("success");
    }
    const user = await googleAccount(identity);
    const session = await createSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    const response = NextResponse.redirect(`${config.origin}/home`);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    // OAuth codes, tokens, claims and provider error payloads must not enter logs.
    return resultRedirect(
      error instanceof GoogleLinkError
        ? error.reason
        : error instanceof GoogleAccountExists
          ? "existing"
          : "failed",
    );
  }
}
