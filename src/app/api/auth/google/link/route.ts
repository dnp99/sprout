import { getSessionUser } from "@/lib/auth/currentUser";
import { readSessionToken } from "@/lib/auth/cookies";
import { verifyUserPassword } from "@/lib/auth/reauth";
import { googleConfig } from "@/lib/auth/google";
import { googleLinkStatus } from "@/lib/auth/google-account";
import { beginGoogleFlow } from "@/lib/auth/google-flow";
import { googleLinkReturnPath, googleSessionHash } from "@/lib/auth/google-link";
import { ok, badRequest, unauthorized, serviceUnavailable, serverError } from "@/lib/http";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  try {
    return ok({ enabled: !!googleConfig(), linked: await googleLinkStatus(user.id) });
  } catch {
    return serverError();
  }
}
/** Re-authentication is required immediately before granting a new login method.
 * A JSON POST with an exact trusted Origin blocks cross-site linking requests. */
export async function POST(request: Request) {
  try {
    const config = googleConfig();
    if (!config) return serviceUnavailable();
    if (request.headers.get("origin") !== config.origin) return unauthorized();
    const user = await getSessionUser(),
      token = await readSessionToken();
    if (!user || !token) return unauthorized();
    const body = await request.json().catch(() => null);
    if (typeof body?.password !== "string" || body.password.length > 1024)
      return badRequest("Password required.");
    if (!(await verifyUserPassword(user.id, body.password)).ok) return unauthorized();
    const url = await beginGoogleFlow(config, {
      userId: user.id,
      sessionHash: googleSessionHash(token),
      returnPath: googleLinkReturnPath(body.returnPath),
    });
    return ok({ url });
  } catch {
    return serverError();
  }
}
