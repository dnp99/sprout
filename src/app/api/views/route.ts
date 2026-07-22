import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { createView, listViews } from "@/lib/views/repository";
import { sanitizeFilters } from "@/lib/views/types";

const MAX_NAME = 60;

/** List the signed-in user's saved views. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok({ views: await listViews(user.id) });
  } catch (error) {
    console.error("GET /api/views failed:", error);
    return serverError();
  }
}

/** Save the current filters as a named view. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      filters?: unknown;
    } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("Name your view.");
    if (name.length > MAX_NAME) return badRequest(`Name must be ${MAX_NAME} characters or fewer.`);

    const view = await createView(user.id, name, sanitizeFilters(body?.filters));
    return ok({ view });
  } catch (error) {
    console.error("POST /api/views failed:", error);
    return serverError();
  }
}
