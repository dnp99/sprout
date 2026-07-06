import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { deleteTransaction, updateTransaction } from "@/lib/transactions/repository";
import { validateUpdateTransaction } from "@/lib/transactions/validation";

/** Edit a transaction (merchant, amount, category, note). */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateUpdateTransaction(body);
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);

    const transaction = await updateTransaction(user.id, id, validation.value);
    if (!transaction) return notFound("Transaction not found.");
    return ok({ transaction });
  } catch (error) {
    console.error("PATCH /api/transactions/[id] failed:", error);
    return serverError();
  }
}

/** Delete a transaction. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const deleted = await deleteTransaction(user.id, id);
    if (!deleted) return notFound("Transaction not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] failed:", error);
    return serverError();
  }
}
