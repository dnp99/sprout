import { deleteUser } from "@/lib/auth/account";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { getSessionUser } from "@/lib/auth/currentUser";
import { verifyUserPassword } from "@/lib/auth/reauth";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

/** Confirmation phrase the client must echo — a deliberate speed bump on an
 *  irreversible action. */
const CONFIRM_PHRASE = "DELETE";

/** Permanently delete the signed-in user and all their data. Re-authenticates
 *  with the password AND requires a typed confirmation, then hard-deletes the
 *  user row (cascading to every child table), drops all sessions (via cascade),
 *  and clears the session cookie. Irreversible. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as {
      password?: unknown;
      confirm?: unknown;
    } | null;
    const password = typeof body?.password === "string" ? body.password : "";
    const confirm = typeof body?.confirm === "string" ? body.confirm : "";

    if (confirm !== CONFIRM_PHRASE) {
      return badRequest(`Type ${CONFIRM_PHRASE} to confirm.`);
    }
    const reauth = await verifyUserPassword(user.id, password);
    if (!reauth.ok) return unauthorized("Password is incorrect.");

    await deleteUser(user.id); // cascades to all user data + sessions
    await clearSessionCookie();
    return ok({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/delete failed:", error);
    return serverError();
  }
}
