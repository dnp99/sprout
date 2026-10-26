import { groupRequest, groupBody } from "@/lib/groups/http";
import { getGroup, mutateGroup } from "@/lib/groups/repository";
import { id, month, parseOperation } from "@/lib/groups/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return groupRequest(request, async (userId) => {
    const groupId = id((await params).id),
      query = new URL(request.url).searchParams;
    const page = Math.max(0, Math.min(100000, Math.floor(Number(query.get("page")) || 0)));
    return getGroup(
      userId,
      groupId,
      month(query.get("month") ?? new Date().toISOString().slice(0, 7)),
      page,
    );
  });
}
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return groupRequest(request, async (userId) =>
    mutateGroup(userId, id((await params).id), parseOperation(await groupBody(request))),
  );
}
