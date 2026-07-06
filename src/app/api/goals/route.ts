import { getSessionUser } from "@/lib/auth/currentUser";
import { createGoal } from "@/lib/goals/repository";
import { validateGoal } from "@/lib/goals/validation";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";

/** Create a savings goal. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const validation = validateGoal(body);
    if (!validation.ok) return badRequest("Invalid goal.", validation.errors);

    const goal = await createGoal(user.id, validation.value);
    return ok({ goal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals failed:", error);
    return serverError();
  }
}
