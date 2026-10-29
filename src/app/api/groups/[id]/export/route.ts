import { EXPORT_RANGES, type ExportRange } from "@/lib/export";
import { getSessionUser } from "@/lib/auth/currentUser";
import { exportGroup } from "@/lib/groups/export";
import { id, GroupError } from "@/lib/groups/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Please sign in." }, { status: 401 });
  try {
    const query = new URL(request.url).searchParams;
    const range = query.get("range") ?? "all";
    const format = query.get("format") ?? "audit";
    if (
      !EXPORT_RANGES.some((r) => r.value === range) ||
      !["transactions", "audit"].includes(format)
    )
      throw new GroupError("Invalid export options.");
    const csv = await exportGroup(user.id, id((await params).id), {
      range: range as ExportRange,
      format: format as "transactions" | "audit",
    });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=sprout-group.csv",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return Response.json(
      { error: e instanceof GroupError ? e.message : "Unable to export." },
      { status: e instanceof GroupError ? e.status : 503 },
    );
  }
}
