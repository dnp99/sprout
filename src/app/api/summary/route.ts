import { getSessionUser } from "@/lib/auth/currentUser";
import { listGoals } from "@/lib/goals/repository";
import { listIncomeSources } from "@/lib/income-sources/repository";
import { ok, serverError, unauthorized } from "@/lib/http";
import { listRecurring } from "@/lib/recurring/repository";
import { getBudgetSummary, listCategories } from "@/lib/transactions/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const [summary, categories, goals, recurring, incomeSources] = await Promise.all([
      getBudgetSummary(user.id),
      listCategories(user.id),
      listGoals(user.id),
      listRecurring(user.id),
      listIncomeSources(user.id),
    ]);
    return ok({ user, summary, categories, goals, recurring, incomeSources });
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return serverError();
  }
}
