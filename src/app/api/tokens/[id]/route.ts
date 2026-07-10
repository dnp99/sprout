import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, serverError, unauthorized } from "@/lib/http";
import { revokeApiToken } from "@/lib/ingest/repository";

/** Revoke an ingest token (soft — sets revoked_at, keeps it for audit). Scoped
 *  to the owner. Idempotent: revoking an unknown/already-revoked id is a no-op. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    await revokeApiToken(user.id, id);
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tokens/[id] failed:", error);
    return serverError();
  }
}
