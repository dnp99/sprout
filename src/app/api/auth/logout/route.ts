import { clearSessionCookie, readSessionToken } from "@/lib/auth/cookies";
import { revokeSession } from "@/lib/auth/sessionRepository";
import { ok, serverError } from "@/lib/http";

export async function POST() {
  try {
    const token = await readSessionToken();
    if (token) await revokeSession(token);
    await clearSessionCookie();
    return ok({ ok: true });
  } catch (error) {
    console.error("POST /api/auth/logout failed:", error);
    return serverError();
  }
}
