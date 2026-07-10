import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { createApiToken, listApiTokens } from "@/lib/ingest/repository";

/** List the signed-in user's active (non-revoked) ingest tokens — never the raw
 *  token or its hash. Cookie-session authed (this is the in-app management UI). */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const tokens = (await listApiTokens(user.id)).filter((t) => !t.revokedAt);
    return ok({ tokens });
  } catch (error) {
    console.error("GET /api/tokens failed:", error);
    return serverError();
  }
}

/** Mint a new ingest token. The raw token is returned **once** here (never
 *  again) so the user can paste it into their Shortcut. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("A name is required.");
    if (name.length > 60) return badRequest("Name must be 60 characters or fewer.");

    const token = await createApiToken(user.id, name);
    return ok({ token }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tokens failed:", error);
    return serverError();
  }
}
