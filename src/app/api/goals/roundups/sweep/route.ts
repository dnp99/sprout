import { getSessionUser } from "@/lib/auth/currentUser";
import { sweepRoundups } from "@/lib/goals/repository";
import { ok, serverError, unauthorized } from "@/lib/http";

/** Sweep the signed-in user's available round-ups into their designated
 *  round-up goal. Idempotent — a second call with nothing new sweeps 0. */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const result = await sweepRoundups(user.id);
    return ok({ result });
  } catch (error) {
    console.error("POST /api/goals/roundups/sweep failed:", error);
    return serverError();
  }
}
