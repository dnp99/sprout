import { normalizeMerchant } from "@/lib/import/normalize";
import type { Category, Transaction } from "@/lib/types";

interface TransactionPatchScope {
  merchant: string;
  categoryId: string | null;
  applyToMerchant?: boolean;
}

/**
 * Reconcile a successful transaction PATCH into the client working set.
 *
 * Merchant-wide category changes update matching rows immediately because the
 * normal store reload intentionally streams the large transaction payload in
 * the background. The later server reload remains authoritative.
 */
export function reconcileTransactionPatch(
  transactions: Transaction[],
  updated: Transaction,
  patch: TransactionPatchScope,
  categories: Category[],
): Transaction[] {
  const category = patch.categoryId
    ? categories.find((entry) => entry.id === patch.categoryId)
    : undefined;
  const pattern = patch.applyToMerchant ? normalizeMerchant(patch.merchant) : "";

  return transactions.map((transaction) => {
    if (transaction.id === updated.id) return updated;
    if (!category || !pattern || normalizeMerchant(transaction.merchant) !== pattern) {
      return transaction;
    }
    return {
      ...transaction,
      categoryId: category.id,
      categoryName: category.name,
      emoji: category.emoji,
    };
  });
}
