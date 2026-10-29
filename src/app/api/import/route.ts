import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { resolveImportSource } from "@/lib/import/request";
import { runImport } from "@/lib/import/run";

const MAX_CSV_BYTES = 8_000_000; // ~8MB

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const csv = (body as { csv?: unknown })?.csv;
    if (typeof csv !== "string" || !csv.trim()) return badRequest("Missing CSV data.");
    if (csv.length > MAX_CSV_BYTES) return badRequest("CSV is too large (max ~8MB).");

    let source;
    try {
      source = resolveImportSource(body);
    } catch (error) {
      return badRequest(error instanceof Error ? error.message : "Invalid import mapping.");
    }

    const aiCategorize = (body as { aiCategorize?: unknown }).aiCategorize === true;
    const summary = await runImport(user.id, csv, source.mapping, source.categoryMap, {
      aiCategorize,
    });
    return ok(summary);
  } catch (error) {
    console.error("POST /api/import failed:", error);
    return serverError("Import failed.");
  }
}
