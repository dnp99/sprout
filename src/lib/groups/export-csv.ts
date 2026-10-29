import { groupCategoryLabel } from "./category-tree";
import type { GroupEntry, GroupCategory, GroupMember } from "./dto";

/** Export a normal signed-money spreadsheet plus payer/author metadata. Numeric
 * amounts remain numeric; protect text cells from spreadsheet formula execution. */
export function groupTransactionsCsv(
  entries: GroupEntry[],
  members: GroupMember[],
  categories: GroupCategory[],
) {
  const cell = (value: string, text = true) =>
    `"${(text && /^[\s]*[=+@-]/.test(value) ? "'" + value : value).replaceAll('"', '""')}"`;
  const name = (id: string | null) =>
    members.find((m) => m.id === id)?.name ?? (id ? "Former member" : "Shared funds");
  const rows = entries
    .filter((e) => !e.voidedAt)
    .map((e) =>
      [
        cell(e.occurredOn),
        cell(e.merchant),
        cell((e.amountCents / 100).toFixed(2), false),
        cell("Group"),
        cell(e.kind === "refund" ? "Reimbursement" : e.kind === "income" ? "Income" : "Expense"),
        cell(groupCategoryLabel(categories, e.categoryId)),
        cell(name(e.payerId)),
        cell(name(e.authorId)),
        cell(e.note),
      ].join(","),
    );
  return [
    "Date,Description,Amount,Source,Transaction Type,Category,Payer,Author,Notes",
    ...rows,
  ].join("\r\n");
}
