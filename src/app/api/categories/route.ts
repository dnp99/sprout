import { getSessionUser } from "@/lib/auth/currentUser";
import { createCategory } from "@/lib/categories/repository";
import { validateCategory } from "@/lib/categories/validation";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

/** Create a spending category. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const validation = validateCategory(body);
    if (!validation.ok) return badRequest("Invalid category.", validation.errors);

    const category = await createCategory(user.id, validation.value);
    return ok({ category }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories failed:", error);
    return serverError();
  }
}
