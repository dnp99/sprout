import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { updateUser } from "@/lib/user/repository";
import { validateProfileUpdate } from "@/lib/user/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok({ user });
}

/** Update the signed-in user's profile (name, currency, budget cycle). */
export async function PATCH(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const validation = validateProfileUpdate(body);
    if (!validation.ok) return badRequest("Invalid profile.", validation.errors);

    const updated = await updateUser(user.id, validation.value);
    if (!updated) return unauthorized();
    return ok({ user: updated });
  } catch (error) {
    console.error("PATCH /api/auth/me failed:", error);
    return serverError();
  }
}
