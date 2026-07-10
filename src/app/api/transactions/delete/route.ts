import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { deleteTransactions } from "@/lib/transactions/repository";

/** Bulk-delete transactions — backs the Transactions table's multi-select.
 *  Body: `{ ids }`. Scoped to the owner. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((x): x is string => typeof x === "string")
      : [];
    if (ids.length === 0) return badRequest("No transactions selected.");

    const count = await deleteTransactions(user.id, ids);
    return ok({ count });
  } catch (error) {
    console.error("POST /api/transactions/delete failed:", error);
    return serverError();
  }
}
