import { getSessionUser } from "@/lib/auth/currentUser";
import { notFound, ok, serverError, unauthorized } from "@/lib/http";
import { deleteIncomeSource } from "@/lib/income-sources/repository";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    return (await deleteIncomeSource(user.id, id))
      ? ok({ ok: true })
      : notFound("Income source not found.");
  } catch (error) {
    console.error("DELETE /api/income-sources/[id] failed:", error);
    return serverError();
  }
}
