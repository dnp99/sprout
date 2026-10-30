import { readSessionToken } from "@/lib/auth/cookies";
import { badRequest, ok, unauthorized, serviceUnavailable, serverError } from "@/lib/http";
import {
  notificationSession,
  settings,
  savePreferences,
  subscribe,
  unsubscribe,
} from "@/lib/notifications/repository";
import { parsePreferences, parseSubscription } from "@/lib/notifications/validation";
import { pushConfig } from "@/lib/notifications/config";

/** All subscription changes require same-origin, session-authenticated requests. */
async function handle(request: Request) {
  try {
    const session = await notificationSession(await readSessionToken());
    if (!session) return unauthorized();
    if (request.method !== "GET") {
      const url = new URL(request.url);
      if (
        request.headers.get("origin") !==
        `${url.protocol}//${request.headers.get("host") ?? url.host}`
      )
        return unauthorized("Invalid origin.");
    }
    if (request.method === "DELETE") await unsubscribe(session.id);
    if (request.method === "POST") {
      const body = await request.text();
      if (body.length > 12000) return badRequest("Request too large.");
      try {
        const value = JSON.parse(body);
        if (value.type === "preferences")
          await savePreferences(session.userId, parsePreferences(value));
        else if (value.type === "subscribe") {
          if (!pushConfig()) return serviceUnavailable("Notifications are not configured.");
          await subscribe(session.userId, session.id, parseSubscription(value.subscription));
        } else return badRequest("Invalid request.");
      } catch {
        return badRequest("Unable to save notification settings.");
      }
    }
    return ok(await settings(session.userId, session.id));
  } catch {
    return serverError("Unable to load notifications.");
  }
}
export const GET = handle;
export const POST = handle;
export const DELETE = handle;
