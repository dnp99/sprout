import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { monarchCategoryMap, monarchMapping } from "@/lib/import/presets/monarch";
import { runImport } from "@/lib/import/run";
import type { ImportMapping } from "@/lib/import/types";

const MAX_CSV_BYTES = 8_000_000; // ~8MB

/** Minimal shape check so a malformed mapping fails fast (not mid-import). */
function isValidMapping(m: unknown): m is ImportMapping {
  const map = m as ImportMapping | null;
  if (!map || typeof map !== "object") return false;
  if (!map.date?.column || !map.merchant?.column || !map.amount) return false;
  const a = map.amount;
  if (a.mode === "signed") return Boolean(a.column);
  if (a.mode === "debitCredit") return Boolean(a.debitColumn && a.creditColumn);
  if (a.mode === "inflowOutflow") return Boolean(a.inflowColumn && a.outflowColumn);
  return false;
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const csv = (body as { csv?: unknown })?.csv;
    if (typeof csv !== "string" || !csv.trim()) return badRequest("Missing CSV data.");
    if (csv.length > MAX_CSV_BYTES) return badRequest("CSV is too large (max ~8MB).");

    let mapping: ImportMapping;
    let categoryMap = {} as typeof monarchCategoryMap;
    if (body.preset === "monarch") {
      mapping = monarchMapping;
      categoryMap = monarchCategoryMap;
    } else if (isValidMapping(body.mapping)) {
      mapping = body.mapping;
    } else {
      return badRequest("Provide a valid preset or column mapping.");
    }

    const aiCategorize = (body as { aiCategorize?: unknown }).aiCategorize === true;
    const summary = await runImport(user.id, csv, mapping, categoryMap, { aiCategorize });
    return ok(summary);
  } catch (error) {
    console.error("POST /api/import failed:", error);
    return serverError("Import failed.");
  }
}
