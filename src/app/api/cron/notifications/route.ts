import { timingSafeEqual } from "node:crypto";
import { queueWeeklyReminders, dispatchNotifications } from "@/lib/notifications/delivery";
import { ok, unauthorized, serviceUnavailable, serverError } from "@/lib/http";
import { pushConfig } from "@/lib/notifications/config";
export const maxDuration = 60;

/** Server scheduler uses a secret, never a user cookie or a public mutation endpoint. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET,
    header = request.headers.get("authorization");
  if (!secret || !header) return unauthorized();
  const expected = Buffer.from(`Bearer ${secret}`),
    actual = Buffer.from(header);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return unauthorized();
  if (!pushConfig()) return serviceUnavailable("Notifications are not configured.");
  try {
    await queueWeeklyReminders();
    return ok(await dispatchNotifications());
  } catch {
    return serverError("Notification job failed.");
  }
}
