import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import {
  InvalidRecurringOccurrenceError,
  markRecurringOccurrencePaid,
} from "@/lib/recurring/repository";
import { validateOccurrenceCompletion } from "@/lib/recurring/validation";

/** Record a manually confirmed recurring occurrence as a normal transaction. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const { id } = await params;
    const body = await request.json().catch(() => null);
    const validation = validateOccurrenceCompletion(body);
    if (!validation.ok) return badRequest("Invalid recurring occurrence.", validation.errors);

    const transaction = await markRecurringOccurrencePaid(user.id, id, validation.value.dueDate);
    if (!transaction) return notFound("Recurring item not found.");
    return ok({ transaction });
  } catch (error) {
    if (error instanceof InvalidRecurringOccurrenceError) {
      return badRequest("This date is not a scheduled occurrence.");
    }
    console.error("POST /api/recurring/[id]/mark-paid failed:", error);
    return serverError();
  }
}
