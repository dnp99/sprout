import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { deleteRecurring, updateRecurring } from "@/lib/recurring/repository";
import { validateRecurring } from "@/lib/recurring/validation";

/** Update a recurring item. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateRecurring(body);
    if (!validation.ok) return badRequest("Invalid recurring item.", validation.errors);

    const recurring = await updateRecurring(user.id, id, validation.value);
    if (!recurring) return notFound("Recurring item not found.");
    return ok({ recurring });
  } catch (error) {
    console.error("PATCH /api/recurring/[id] failed:", error);
    return serverError();
  }
}

/** Delete a recurring item. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const deleted = await deleteRecurring(user.id, id);
    if (!deleted) return notFound("Recurring item not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/recurring/[id] failed:", error);
    return serverError();
  }
}
