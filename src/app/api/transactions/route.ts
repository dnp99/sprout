import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { userOwnsIncomeSource } from "@/lib/income-sources/repository";
import { createTransaction, listRecentTransactions } from "@/lib/transactions/repository";
import { validateCreateTransaction } from "@/lib/transactions/validation";

// The client loads the full working set once into the store (so filters like
// "uncategorized" see everything, not just the latest page). Cap it so a very
// large history can't return an unbounded payload; paginate if this grows.
const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 10000;

export async function GET(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const raw = Number(new URL(request.url).searchParams.get("limit"));
    const limit = raw > 0 ? Math.min(raw, MAX_LIMIT) : DEFAULT_LIMIT;
    const transactions = await listRecentTransactions(user.id, limit);
    return ok({ transactions });
  } catch (error) {
    console.error("GET /api/transactions failed:", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const validation = validateCreateTransaction(body);
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);
    if (
      validation.value.incomeSourceId &&
      !(await userOwnsIncomeSource(user.id, validation.value.incomeSourceId))
    ) {
      return badRequest("Invalid transaction.", ["incomeSourceId must be one of your income sources"]);
    }

    const transaction = await createTransaction(user.id, validation.value);
    return ok({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions failed:", error);
    return serverError();
  }
}
