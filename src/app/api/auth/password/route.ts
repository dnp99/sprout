import { updateUserPassword } from "@/lib/auth/account";
import { readSessionToken } from "@/lib/auth/cookies";
import { getSessionUser } from "@/lib/auth/currentUser";
import { hashPassword } from "@/lib/auth/password";
import { verifyUserPassword } from "@/lib/auth/reauth";
import { revokeOtherSessions } from "@/lib/auth/sessionRepository";
import { MIN_PASSWORD } from "@/lib/auth/validation";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

/** Change the signed-in user's password: re-authenticate with the current one,
 *  validate + hash the new one, and revoke all OTHER sessions so a session
 *  elsewhere can't outlive the change. The current session stays valid. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as {
      currentPassword?: unknown;
      newPassword?: unknown;
    } | null;
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (newPassword.length < MIN_PASSWORD) {
      return badRequest(`Password must be at least ${MIN_PASSWORD} characters.`);
    }
    if (newPassword === currentPassword) {
      return badRequest("New password must be different from the current one.");
    }

    const reauth = await verifyUserPassword(user.id, currentPassword);
    if (!reauth.ok) return unauthorized("Current password is incorrect.");

    await updateUserPassword(user.id, await hashPassword(newPassword));

    const token = await readSessionToken();
    const revoked = token ? await revokeOtherSessions(user.id, token) : 0;
    return ok({ ok: true, revoked });
  } catch (error) {
    console.error("POST /api/auth/password failed:", error);
    return serverError();
  }
}
