import { groupCategoryLabel } from "./category-tree";
import { listGroupMembers } from "./members";
import { exportRangeStart, type ExportRange } from "@/lib/export";
import { localCalendarDate } from "@/lib/calendar";
import { groupTransactionsCsv } from "./export-csv";
import { getDb } from "@/db";
import { eq } from "drizzle-orm";
import { groupCategories } from "@/db/schema";
import { groupContext, ledger } from "./context";

/** Export authorized group finances and current account display names only;
 * private personal financial records and invitation secrets never enter CSVs. */
export async function exportGroup(
  userId: string,
  groupId: string,
  options: { range?: ExportRange; format?: "transactions" | "audit" } = {},
) {
  return getDb().transaction(async (tx) => {
    await groupContext(tx, userId, groupId);
    const members = await listGroupMembers(tx, groupId);
    const categories = await tx
      .select()
      .from(groupCategories)
      .where(eq(groupCategories.groupId, groupId));
    const name = (id: string | null) =>
      id ? (members.find((m) => m.id === id)?.name ?? "Former member") : "Shared funds";
    const { entries, repayments } = await ledger(tx, groupId);
    const rangeStart = exportRangeStart(options.range ?? "all");
    const startDate = rangeStart ? localCalendarDate(rangeStart) : "";
    if (options.format === "transactions")
      return groupTransactionsCsv(
        entries.filter((e) => e.occurredOn >= startDate),
        members,
        categories,
      );
    const rows: unknown[][] = [
      [
        "ID",
        "Type",
        "Date",
        "Description",
        "Category",
        "Payer / Sender",
        "Recipient",
        "Author",
        "Amount (cents)",
        "Shares (cents)",
        "Status",
        "Original expense / Reason",
      ],
    ];
    for (const e of entries.filter((e) => e.occurredOn >= startDate))
      rows.push([
        e.id,
        e.kind,
        e.occurredOn,
        e.merchant,
        groupCategoryLabel(categories, e.categoryId),
        name(e.payerId),
        "",
        name(e.authorId),
        e.amountCents,
        JSON.stringify(
          e.shares.map((s) => ({
            memberId: s.memberId,
            name: name(s.memberId),
            cents: s.amountCents,
          })),
        ),
        e.voidedAt ? "void" : "posted",
        e.refundOf ?? "",
      ]);
    for (const r of repayments.filter((r) => r.occurredOn >= startDate))
      rows.push([
        r.id,
        "repayment",
        r.occurredOn,
        r.note,
        "",
        name(r.senderId),
        name(r.recipientId),
        name(r.recordedBy),
        r.amountCents,
        "",
        r.reversedAt ? "reversed" : "posted",
        r.reversalReason ?? "",
      ]);
    return rows
      .map((row) =>
        row
          .map(
            (value) =>
              '"' +
              String(value ?? "")
                .replace(/^[\s]*[=+@-]/, "'$&")
                .replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n");
  });
}
