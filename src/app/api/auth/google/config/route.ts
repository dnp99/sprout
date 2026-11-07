import { googleConfig } from "@/lib/auth/google";
export const dynamic = "force-dynamic";
export function GET() {
  try {
    return Response.json(
      { enabled: !!googleConfig() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  }
}
