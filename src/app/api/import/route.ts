import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import type { SproutCategoryKey } from "@/lib/import/category-map";
import { getPreset, verifyPresetHeaders } from "@/lib/import/presets";
import { parseCsv } from "@/lib/import/read-csv";
import { runImport } from "@/lib/import/run";
import type { ImportMapping } from "@/lib/import/types";

const MAX_CSV_BYTES = 8_000_000; // ~8MB

/** Minimal shape check so a malformed custom mapping fails fast (not mid-import).
 *  Presets are resolved through the registry, not this check. */
function isValidMapping(m: unknown): m is ImportMapping {
  const map = m as ImportMapping | null;
  if (!map || typeof map !== "object") return false;
  if (!map.date?.column || !map.merchant?.column || !map.amount) return false;
  const a = map.amount;
  if (a.mode === "signed") return Boolean(a.column);
  if (a.mode === "debitCredit") return Boolean(a.debitColumn && a.creditColumn);
  if (a.mode === "inflowOutflow") return Boolean(a.inflowColumn && a.outflowColumn);
  if (a.mode === "signedByType") return Boolean(a.column && a.typeColumn);
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
    let categoryMap: Record<string, SproutCategoryKey> = {};

    const presetId = (body as { preset?: unknown }).preset;
    if (typeof presetId === "string") {
      // Server-authoritative: reject unknown ids and verify the uploaded headers
      // actually match the selected preset before importing.
      const preset = getPreset(presetId);
      if (!preset) return badRequest("Unknown import preset.");
      const headers = parseCsv(csv)[0] ?? [];
      if (!verifyPresetHeaders(preset, headers)) {
        return badRequest("This file doesn't match the selected source.");
      }
      mapping = preset.mapping;
      categoryMap = preset.categoryMap;
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
