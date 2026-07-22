import { readSessionToken } from "@/lib/auth/cookies";
import { getSessionUser } from "@/lib/auth/currentUser";
import { revokeOtherSessions } from "@/lib/auth/sessionRepository";
import { ok, serverError, unauthorized } from "@/lib/http";

/** Sign out every other device: revoke all of the user's sessions except the
 *  current one. */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const token = await readSessionToken();
    const revoked = token ? await revokeOtherSessions(user.id, token) : 0;
    return ok({ ok: true, revoked });
  } catch (error) {
    console.error("POST /api/auth/sessions/revoke-others failed:", error);
    return serverError();
  }
}
