import { groupRequest, groupBody } from "@/lib/groups/http";
import { createGroup, joinGroup, previewInvite, listGroups } from "@/lib/groups/repository";
import { object, text, id, GroupError } from "@/lib/groups/validation";

export async function GET(request: Request) {
  return groupRequest(request, async (userId) => ({ groups: await listGroups(userId) }));
}
export async function POST(request: Request) {
  return groupRequest(request, async (userId) => {
    const body = object(await groupBody(request));
    if (body.type === "create")
      return createGroup(userId, text(body.name, 50), id(body.mutationId));
    if (body.type === "join") return joinGroup(userId, text(body.token, 48));
    if (body.type === "preview") return previewInvite(userId, text(body.token, 48));
    throw new GroupError("Unknown operation.");
  });
}
