import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { listCategories, setCategoryForTransactions } from "@/lib/transactions/repository";

/** Bulk-assign a category (or null to clear) to many transactions at once —
 *  backs the Transactions table's multi-select. Body: `{ ids, categoryId }`. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as {
      ids?: unknown;
      categoryId?: unknown;
    } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((x): x is string => typeof x === "string")
      : [];
    if (ids.length === 0) return badRequest("No transactions selected.");

    const categoryId =
      body?.categoryId === undefined || body?.categoryId === null || body?.categoryId === ""
        ? null
        : String(body.categoryId);

    // Never assign a category the user doesn't own.
    if (categoryId !== null) {
      const owned = await listCategories(user.id);
      if (!owned.some((c) => c.id === categoryId)) return badRequest("Unknown category.");
    }

    const count = await setCategoryForTransactions(user.id, ids, categoryId);
    return ok({ count });
  } catch (error) {
    console.error("POST /api/transactions/categorize failed:", error);
    return serverError();
  }
}
