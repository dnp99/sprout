import { deleteCategory, updateCategory } from "@/lib/categories/repository";
import { validateCategory } from "@/lib/categories/validation";
import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";

/** Update a category (name, emoji, color, monthly budget). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateCategory(body);
    if (!validation.ok) return badRequest("Invalid category.", validation.errors);

    const category = await updateCategory(user.id, id, validation.value);
    if (!category) return notFound("Category not found.");
    return ok({ category });
  } catch (error) {
    console.error("PATCH /api/categories/[id] failed:", error);
    return serverError();
  }
}

/** Delete a category. Its transactions become uncategorized (SET NULL). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const removed = await deleteCategory(user.id, id);
    if (!removed) return notFound("Category not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/categories/[id] failed:", error);
    return serverError();
  }
}
