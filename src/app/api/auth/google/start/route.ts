import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CodeChallengeMethod } from "google-auth-library";
import {
  googleConfig,
  googleClient,
  newGoogleFlow,
  googleChallenge,
  GOOGLE_FLOW_COOKIE,
  GOOGLE_FLOW_SECONDS,
} from "@/lib/auth/google";
export const dynamic = "force-dynamic";
export async function GET() {
  const config = googleConfig();
  if (!config)
    return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const flow = newGoogleFlow();
  (await cookies()).set(
    GOOGLE_FLOW_COOKIE,
    Buffer.from(JSON.stringify(flow)).toString("base64url"),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: GOOGLE_FLOW_SECONDS,
    },
  );
  const url = googleClient(config).generateAuthUrl({
    scope: ["openid", "email", "profile"],
    state: flow.state,
    nonce: flow.nonce,
    code_challenge: googleChallenge(flow.verifier),
    code_challenge_method: CodeChallengeMethod.S256,
    prompt: "select_account",
  });
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
