import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import {
  applyRuleToExisting,
  categoryBelongsToUser,
  deleteRule,
  updateRuleCategory,
} from "@/lib/rules/repository";

/** Recategorize a rule (editing promotes it to manual), optionally applying it
 *  to existing matching transactions. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = (await request.json().catch(() => null)) as {
      categoryId?: unknown;
      apply?: unknown;
    } | null;
    const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
    const apply = body?.apply === true;
    if (!categoryId) return badRequest("Pick a category.");
    if (!(await categoryBelongsToUser(user.id, categoryId))) return badRequest("Invalid category.");

    const updated = await updateRuleCategory(user.id, id, categoryId);
    if (!updated) return notFound("Rule not found.");

    const applied = apply ? await applyRuleToExisting(user.id, updated.pattern, categoryId) : 0;
    return ok({ ok: true, applied });
  } catch (error) {
    console.error("PATCH /api/rules/[id] failed:", error);
    return serverError();
  }
}

/** Delete a rule. Existing transactions keep their category. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const removed = await deleteRule(user.id, id);
    if (!removed) return notFound("Rule not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/rules/[id] failed:", error);
    return serverError();
  }
}
