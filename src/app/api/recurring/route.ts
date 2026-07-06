import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { createRecurring } from "@/lib/recurring/repository";
import { validateRecurring } from "@/lib/recurring/validation";

/** Create a recurring item (bill / subscription / income). */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const validation = validateRecurring(body);
    if (!validation.ok) return badRequest("Invalid recurring item.", validation.errors);

    const recurring = await createRecurring(user.id, validation.value);
    return ok({ recurring }, { status: 201 });
  } catch (error) {
    console.error("POST /api/recurring failed:", error);
    return serverError();
  }
}
