import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { userOwnsIncomeSource } from "@/lib/income-sources/repository";
import { setIncomeSourceForTransactions } from "@/lib/transactions/repository";

/** Bulk-label selected income rows. Expenses are deliberately ignored by the
 * repository, preserving the income-source boundary even for mixed selections. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => null)) as {
      ids?: unknown;
      incomeSourceId?: unknown;
    } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((value): value is string => typeof value === "string")
      : [];
    if (ids.length === 0) return badRequest("No transactions selected.");
    const incomeSourceId =
      body?.incomeSourceId === undefined || body?.incomeSourceId === null || body?.incomeSourceId === ""
        ? null
        : String(body.incomeSourceId);
    if (incomeSourceId && !(await userOwnsIncomeSource(user.id, incomeSourceId))) {
      return badRequest("Unknown income source.");
    }
    return ok({ count: await setIncomeSourceForTransactions(user.id, ids, incomeSourceId) });
  } catch (error) {
    console.error("POST /api/transactions/income-source failed:", error);
    return serverError();
  }
}
