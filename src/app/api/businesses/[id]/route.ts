import { getSessionUser } from "@/lib/auth/currentUser";
import { deleteBusiness, updateBusiness } from "@/lib/businesses/repository";
import { validateBusiness } from "@/lib/businesses/validation";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const result = validateBusiness(await request.json().catch(() => null));
    if (!result.ok) return badRequest("Invalid business.", result.errors);
    const { id } = await params;
    const business = await updateBusiness(user.id, id, result.value);
    return business ? ok({ business }) : notFound("Business not found.");
  } catch (error) {
    console.error("PATCH /api/businesses/[id] failed:", error);
    return serverError();
  }
}
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    return (await deleteBusiness(user.id, id)) ? ok({ ok: true }) : notFound("Business not found.");
  } catch (error) {
    console.error("DELETE /api/businesses/[id] failed:", error);
    return serverError();
  }
}
