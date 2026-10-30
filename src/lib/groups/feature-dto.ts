import type { Transaction } from "@/lib/types";
import type { GroupSnapshot } from "./dto";

/** Financial dates and signed cents are retained when adapting shared reports. */
export function groupFeatureTransactions(data: GroupSnapshot): Transaction[] {
  return (data.reportEntries ?? data.entries)
    .filter((e) => !e.voidedAt)
    .map((e) => {
      const category = data.categories.find((c) => c.id === e.categoryId);
      return {
        id: e.id,
        merchant: e.merchant,
        emoji: category?.emoji ?? "🏷️",
        categoryId: e.categoryId,
        categoryName: category?.name ?? "",
        amountCents: e.amountCents,
        note: e.note,
        method: "",
        status: "posted",
        dateLabel: e.occurredOn,
        occurredAt: `${e.occurredOn}T12:00:00.000Z`,
        createdAt: e.createdAt,
        isIncome: e.kind === "income",
        kind: e.kind === "refund" ? "reimbursement" : (e.kind as "income" | "expense"),
        recurringItemId: e.recurringItemId,
        roundupSwept: !!e.roundupSweptAt,
      };
    });
}
