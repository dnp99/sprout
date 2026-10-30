import { groupBody, groupRequest } from "@/lib/groups/http";
import { bulkGroup } from "@/lib/groups/bulk";
import { parseGroupBulk } from "@/lib/groups/bulk-validation";
import { id } from "@/lib/groups/validation";

/** Selection is explicit, versioned and session-scoped, never an unbounded filter mutation. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return groupRequest(request, async (userId) =>
    bulkGroup(userId, id((await params).id), parseGroupBulk(await groupBody(request))),
  );
}

export const maxDuration = 60;
