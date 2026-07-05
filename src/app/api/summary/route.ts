import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, serverError, unauthorized } from "@/lib/http";
import { getBudgetSummary, listCategories } from "@/lib/transactions/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const [summary, categories] = await Promise.all([
      getBudgetSummary(user.id),
      listCategories(user.id),
    ]);
    return ok({ user, summary, categories });
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return serverError();
  }
}
