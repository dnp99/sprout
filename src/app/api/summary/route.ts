import { getCurrentUser } from "@/lib/currentUser";
import { badRequest, ok, serverError } from "@/lib/http";
import { getBudgetSummary, listCategories } from "@/lib/transactions/repository";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return badRequest("No user found. Seed the database first.");

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
