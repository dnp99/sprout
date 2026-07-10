import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, serverError, unauthorized } from "@/lib/http";
import { createLinkCode } from "@/lib/ingest/repository";

/** Mint a one-time WhatsApp link code for the signed-in user. They text
 *  `link <code>` to the Sprout WhatsApp number to bind their phone. Returns the
 *  code plus the sandbox number (for the in-app instructions). Cookie-authed. */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const code = await createLinkCode(user.id);
    return ok({ code, number: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? null }, { status: 201 });
  } catch (error) {
    console.error("POST /api/channels/whatsapp/link failed:", error);
    return serverError();
  }
}
