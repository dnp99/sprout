import { getSessionUser } from "@/lib/auth/currentUser";
import { deleteGoal, updateGoal } from "@/lib/goals/repository";
import { validateGoal } from "@/lib/goals/validation";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";

/** Update a savings goal. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateGoal(body);
    if (!validation.ok) return badRequest("Invalid goal.", validation.errors);

    const goal = await updateGoal(user.id, id, validation.value);
    if (!goal) return notFound("Goal not found.");
    return ok({ goal });
  } catch (error) {
    console.error("PATCH /api/goals/[id] failed:", error);
    return serverError();
  }
}

/** Delete a savings goal. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const deleted = await deleteGoal(user.id, id);
    if (!deleted) return notFound("Goal not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/goals/[id] failed:", error);
    return serverError();
  }
}
