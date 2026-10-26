import { getSessionUser } from "@/lib/auth/currentUser";
import { unauthorized } from "@/lib/http";
import { GroupError } from "./validation";

/** Keep session/CSRF/body limits consistent across every group write endpoint. */
export async function groupRequest(request: Request, run: (userId: string) => Promise<unknown>) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (request.method !== "GET" && request.headers.get("origin") !== new URL(request.url).origin)
      throw new GroupError("Invalid request origin.", 403);
    return Response.json(await run(user.id), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof GroupError)
      return Response.json(
        { error: error.message, details: error.details },
        { status: error.status, headers: { "Cache-Control": "no-store" } },
      );
    console.error("Group request failed", error instanceof Error ? error.name : "Unknown error");
    return Response.json(
      { error: "Unable to load or save the group. Please try again." },
      { status: 503 },
    );
  }
}
export async function groupBody(request: Request): Promise<unknown> {
  const body = await request.text();
  if (body.length > 32000) throw new GroupError("Request too large.", 413);
  try {
    return JSON.parse(body);
  } catch {
    throw new GroupError("Invalid request.");
  }
}
