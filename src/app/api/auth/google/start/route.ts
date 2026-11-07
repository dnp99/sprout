import { NextResponse } from "next/server";
import { googleConfig } from "@/lib/auth/google";
import { beginGoogleFlow } from "@/lib/auth/google-flow";
export const dynamic = "force-dynamic";
export async function GET() {
  const config = googleConfig();
  if (!config)
    return Response.json({ error: "Google sign-in is not configured." }, { status: 503 });
  const response = NextResponse.redirect(await beginGoogleFlow(config));
  response.headers.set("Cache-Control", "no-store");
  return response;
}
