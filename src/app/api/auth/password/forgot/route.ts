import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import {
  allowPasswordResetRequest,
  createPasswordResetToken,
  createResetToken,
  hashResetValue,
  invalidatePasswordResetToken,
  normalizeEmail,
  resetExpiry,
} from "@/lib/auth/passwordReset";
import { passwordResetUrl, sendPasswordResetEmail } from "@/lib/email/passwordReset";
import { ok, serverError } from "@/lib/http";

const GENERIC_RESPONSE = { ok: true };

function requestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** Always returns the same body for known and unknown accounts to prevent enumeration. */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    const email = normalizeEmail(body?.email);
    if (!email) return ok(GENERIC_RESPONSE);

    const allowed = await allowPasswordResetRequest(email, requestIp(request));
    if (!allowed) return ok(GENERIC_RESPONSE);

    const [user] = await getDb().select().from(users).where(eq(users.email, email)).limit(1);
    if (!user?.passwordHash) return ok(GENERIC_RESPONSE);

    const token = createResetToken();
    const tokenHash = hashResetValue(token);
    const expiresAt = resetExpiry();
    await createPasswordResetToken(user.id, tokenHash, expiresAt);
    try {
      await sendPasswordResetEmail({
        to: user.email,
        resetUrl: passwordResetUrl(token),
        expiresAt,
      });
    } catch (error) {
      await invalidatePasswordResetToken(tokenHash);
      console.error("POST /api/auth/password/forgot email delivery failed:", error);
    }
    return ok(GENERIC_RESPONSE);
  } catch (error) {
    // Keep the client response identical even if storage is unavailable.
    console.error("POST /api/auth/password/forgot failed:", error);
    return ok(GENERIC_RESPONSE);
  }
}
