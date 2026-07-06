import { getSessionUser } from "@/lib/auth/currentUser";
import { type ExportRange, exportRangeStart, transactionsToCsv } from "@/lib/export";
import { unauthorized } from "@/lib/http";
import { listTransactionsForExport } from "@/lib/transactions/repository";

const RANGES = new Set<ExportRange>(["month", "quarter", "year", "all"]);

/** Download the signed-in user's transactions as CSV, optionally date-ranged. */
export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const raw = new URL(request.url).searchParams.get("range");
  const range: ExportRange = RANGES.has(raw as ExportRange) ? (raw as ExportRange) : "all";

  const rows = await listTransactionsForExport(user.id, exportRangeStart(range));
  const csv = transactionsToCsv(rows);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sprout-transactions-${range}.csv"`,
    },
  });
}
