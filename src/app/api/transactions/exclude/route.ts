import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { setTransactionsBudgetExclusion } from "@/lib/transactions/repository";

/** Bulk-exclude only rows owned by the current user. Exclusion is reversible
 * from an individual transaction edit, so this endpoint never deletes data. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => null)) as {
      ids?: unknown;
      exclude?: unknown;
    } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value): value is string => typeof value === "string")
      : [];
    if (ids.length === 0) return badRequest("No transactions selected.");
    return ok({
      count: await setTransactionsBudgetExclusion(user.id, ids, body?.exclude !== false),
    });
  } catch (error) {
    console.error("POST /api/transactions/exclude failed:", error);
    return serverError();
  }
}
