/** Manual entry is shared by Personal and Groups; imports/capture may arrive
 * uncategorized for review. Signed cents allow the same rule at API boundaries. */
export function transactionAmountRequired(amountCents: unknown): boolean {
  return typeof amountCents !== "number" || !Number.isSafeInteger(amountCents) || amountCents === 0;
}

export type TransactionRequiredIssue = "amountRequired" | "categoryRequired";
export const transactionRequiredMessages: Record<TransactionRequiredIssue, string> = {
  amountRequired: "Enter a non-zero integer amount in cents.",
  categoryRequired: "Choose a category before saving the transaction.",
};

/** Drafts enter positive magnitudes; APIs may opt into signed stored cents.
 * Stable keys let forms translate the same requirements enforced by servers. */
export function transactionRequiredIssues({
  amountCents,
  categoryId,
  signedAmount = false,
}: {
  amountCents: unknown;
  categoryId: unknown;
  signedAmount?: boolean;
}): TransactionRequiredIssue[] {
  const issues: TransactionRequiredIssue[] = [];
  if (
    transactionAmountRequired(amountCents) ||
    (!signedAmount && typeof amountCents === "number" && amountCents < 0)
  )
    issues.push("amountRequired");
  if (typeof categoryId !== "string" || !categoryId.trim()) issues.push("categoryRequired");
  return issues;
}
