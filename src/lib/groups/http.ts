import { after } from "next/server";
import { pushConfig } from "@/lib/notifications/config";
import { dispatchNotifications } from "@/lib/notifications/delivery";
import { getSessionUser } from "@/lib/auth/currentUser";
import { unauthorized } from "@/lib/http";
import { GroupError } from "./validation";

/** Keep session/CSRF/body limits consistent across every group write endpoint. */
export async function groupRequest(request: Request, run: (userId: string) => Promise<unknown>) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    // Next.js may normalize the internal URL to localhost even when the browser
    // uses 127.0.0.1. Host describes the actual requested authority; keep the
    // protocol and port exact and never trust a client-provided forwarded origin.
    const url = new URL(request.url);
    const authority = request.headers.get("host") ?? url.host;
    const expectedOrigin = `${url.protocol}//${authority}`;
    if (request.method !== "GET" && request.headers.get("origin") !== expectedOrigin)
      throw new GroupError("Invalid request origin.", 403);
    const result = await run(user.id);
    if (request.method === "POST" && pushConfig()) {
      // Push is outside the financial transaction and must never change its outcome.
      try {
        after(async () => {
          try {
            await dispatchNotifications();
          } catch {
            console.error("Notification delivery deferred.");
          }
        });
      } catch {
        console.error("Notification delivery deferred to scheduler.");
      }
    }
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
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
