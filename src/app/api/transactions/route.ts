import { getCurrentUser } from "@/lib/currentUser";
import { badRequest, ok, serverError } from "@/lib/http";
import { createTransaction, listRecentTransactions } from "@/lib/transactions/repository";
import { validateCreateTransaction } from "@/lib/transactions/validation";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return badRequest("No user found. Seed the database first.");

    const transactions = await listRecentTransactions(user.id);
    return ok({ transactions });
  } catch (error) {
    console.error("GET /api/transactions failed:", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return badRequest("No user found. Seed the database first.");

    const body = await request.json().catch(() => null);
    const validation = validateCreateTransaction(body);
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);

    const transaction = await createTransaction(user.id, validation.value);
    return ok({ transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions failed:", error);
    return serverError();
  }
}
