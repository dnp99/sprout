import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, serverError, unauthorized } from "@/lib/http";
import { deleteChannelBinding, getChannelBinding } from "@/lib/ingest/repository";

/** Mask an E.164 phone to its last 4 digits ("••• 0123") — enough for the user
 *  to recognize their own number without echoing it in full. */
function maskPhone(e164: string): string {
  const last4 = e164.replace(/\D/g, "").slice(-4);
  return `••• ${last4}`;
}

/** WhatsApp link status for Settings — whether the signed-in user has a linked
 *  phone, a masked hint, and when it was last used. Cookie-authed. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const binding = await getChannelBinding(user.id, "whatsapp");
    if (!binding) return ok({ connected: false });
    return ok({
      connected: true,
      phoneMasked: maskPhone(binding.externalId),
      linkedAt: binding.verifiedAt?.toISOString() ?? null,
      lastUsedAt: binding.lastIngestAt?.toISOString() ?? null,
    });
  } catch (error) {
    console.error("GET /api/channels/whatsapp failed:", error);
    return serverError();
  }
}

/** Disconnect (unlink) the signed-in user's WhatsApp binding. */
export async function DELETE() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    await deleteChannelBinding(user.id, "whatsapp");
    return ok({ connected: false });
  } catch (error) {
    console.error("DELETE /api/channels/whatsapp failed:", error);
    return serverError();
  }
}
