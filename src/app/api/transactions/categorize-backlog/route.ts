import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, serverError, serviceUnavailable, unauthorized } from "@/lib/http";
import { categorizeBacklog } from "@/lib/transactions/backlog";

/** Run AI categorization over the signed-in user's uncategorized expense
 *  backlog (cached merchant rules first, then Haiku). Best-effort and
 *  idempotent — a second run finds nothing new. */
export async function POST() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    if (!process.env.ANTHROPIC_API_KEY) {
      return serviceUnavailable("AI categorization isn’t configured (no API key).");
    }
    const result = await categorizeBacklog(user.id);
    return ok({ result });
  } catch (error) {
    console.error("POST /api/transactions/categorize-backlog failed:", error);
    return serverError();
  }
}
