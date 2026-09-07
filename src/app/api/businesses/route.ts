import { getSessionUser } from "@/lib/auth/currentUser";
import { createBusiness, listBusinesses } from "@/lib/businesses/repository";
import { validateBusiness } from "@/lib/businesses/validation";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok({ businesses: await listBusinesses(user.id) });
  } catch (error) {
    console.error("GET /api/businesses failed:", error);
    return serverError();
  }
}
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const result = validateBusiness(await request.json().catch(() => null));
    if (!result.ok) return badRequest("Invalid business.", result.errors);
    return ok({ business: await createBusiness(user.id, result.value) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/businesses failed:", error);
    return serverError();
  }
}
