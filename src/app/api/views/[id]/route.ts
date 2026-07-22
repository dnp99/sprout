import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { deleteView, renameView } from "@/lib/views/repository";

const MAX_NAME = 60;

/** Rename a saved view. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = (await request.json().catch(() => null)) as { name?: unknown } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    if (!name) return badRequest("Name your view.");
    if (name.length > MAX_NAME) return badRequest(`Name must be ${MAX_NAME} characters or fewer.`);

    const renamed = await renameView(user.id, id, name);
    if (!renamed) return notFound("View not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("PATCH /api/views/[id] failed:", error);
    return serverError();
  }
}

/** Delete a saved view. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const removed = await deleteView(user.id, id);
    if (!removed) return notFound("View not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/views/[id] failed:", error);
    return serverError();
  }
}
