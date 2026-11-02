import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { userOwnsCategory } from "@/lib/categories/repository";
import { userOwnsIncomeSource } from "@/lib/income-sources/repository";
import { NO_BUSINESS } from "@/lib/businesses/activity";
import { userOwnsBusiness } from "@/lib/businesses/repository";
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

    const params = new URL(request.url).searchParams;
    const businessId = params.get("businessId") || undefined;
    const raw = Number(params.get("limit"));
    const limit = raw > 0 && isFinite(raw) ? Math.min(Math.floor(raw), MAX_LIMIT) : DEFAULT_LIMIT;
    const offset = Number(params.get("offset") ?? 0);
    if (offset < 0 || !Number.isSafeInteger(offset)) return badRequest("Invalid offset.");
    if (
      businessId &&
      businessId !== NO_BUSINESS &&
      (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(businessId) ||
        !(await userOwnsBusiness(user.id, businessId)))
    )
      return badRequest("Invalid business.");
    // A look-ahead row prevents a large business history from silently stopping
    // at the ordinary working-set cap. Ownership stays enforced on every page.
    if (businessId) {
      const rows = await listRecentTransactions(user.id, limit + 1, businessId, offset);
      return ok({
        transactions: rows.slice(0, limit),
        hasMore: rows.length > limit,
        userId: user.id,
      });
    }
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
    const validation = validateCreateTransaction(body, { requireCategory: true });
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);
    if (!(await userOwnsCategory(user.id, validation.value.categoryId!))) {
      return badRequest("Invalid transaction.", ["categoryId must be one of your categories"]);
    }
    if (
      validation.value.incomeSourceId &&
      !(await userOwnsIncomeSource(user.id, validation.value.incomeSourceId))
    ) {
      return badRequest("Invalid transaction.", [
        "incomeSourceId must be one of your income sources",
      ]);
    }
    if (
      validation.value.businessId &&
      !(await userOwnsBusiness(user.id, validation.value.businessId))
    ) {
      return badRequest("Invalid transaction.", ["businessId must be one of your businesses"]);
    }

    const transaction = await createTransaction(user.id, validation.value);
    return ok({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions failed:", error);
    return serverError();
  }
}
