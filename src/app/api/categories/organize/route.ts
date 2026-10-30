import { organizeCategories } from "@/lib/categories/organize-repository";
import { parseCategoryTree } from "@/lib/groups/category-tree-validation";
import { groupRequest, groupBody } from "@/lib/groups/http";
import { GroupError, object } from "@/lib/groups/validation";

export async function POST(request: Request) {
  return groupRequest(request, async (userId) => {
    const body = object(await groupBody(request));
    if (!Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0)
      throw new GroupError("Reload categories.");
    return organizeCategories(userId, parseCategoryTree(body.draft), Number(body.expectedRevision));
  });
}
