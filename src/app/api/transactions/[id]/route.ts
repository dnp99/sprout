import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { userOwnsIncomeSource } from "@/lib/income-sources/repository";
import { userOwnsBusiness } from "@/lib/businesses/repository";
import {
  applyCategoryToMerchant,
  deleteTransaction,
  updateTransaction,
} from "@/lib/transactions/repository";
import { validateUpdateTransaction } from "@/lib/transactions/validation";

/** Edit a transaction (merchant, amount, category, note). With
 *  `applyToMerchant: true` and a category set, the same category is also
 *  applied to every other transaction from that merchant and cached as a rule. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateUpdateTransaction(body);
    if (!validation.ok) return badRequest("Invalid transaction.", validation.errors);
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

    const transaction = await updateTransaction(user.id, id, validation.value);
    if (!transaction) return notFound("Transaction not found.");

    // Propagate to the whole merchant only when asked and a category was set.
    let appliedToMerchant = 0;
    const applyToMerchant = (body as { applyToMerchant?: unknown })?.applyToMerchant === true;
    if (applyToMerchant && validation.value.categoryId) {
      appliedToMerchant = await applyCategoryToMerchant(
        user.id,
        validation.value.merchant,
        validation.value.categoryId,
      );
    }

    return ok({ transaction, appliedToMerchant });
  } catch (error) {
    console.error("PATCH /api/transactions/[id] failed:", error);
    return serverError();
  }
}

/** Delete a transaction. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const deleted = await deleteTransaction(user.id, id);
    if (!deleted) return notFound("Transaction not found.");
    return ok({ ok: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] failed:", error);
    return serverError();
  }
}
