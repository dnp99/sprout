import { hashPassword } from "@/lib/auth/password";
import { hashResetValue, resetPasswordWithToken } from "@/lib/auth/passwordReset";
import { MIN_PASSWORD } from "@/lib/auth/validation";
import { badRequest, ok, serverError } from "@/lib/http";

const INVALID_LINK = "This reset link is invalid or has expired.";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
      newPassword?: unknown;
    } | null;
    const token = typeof body?.token === "string" ? body.token : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
    if (!token || token.length > 256) return badRequest(INVALID_LINK);
    if (newPassword.length < MIN_PASSWORD) {
      return badRequest(`Password must be at least ${MIN_PASSWORD} characters.`);
    }

    const changed = await resetPasswordWithToken(
      hashResetValue(token),
      await hashPassword(newPassword),
    );
    return changed ? ok({ ok: true }) : badRequest(INVALID_LINK);
  } catch (error) {
    console.error("POST /api/auth/password/reset failed:", error);
    return serverError();
  }
}
