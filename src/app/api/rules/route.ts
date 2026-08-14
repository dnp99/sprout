import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import {
  applyRuleToExisting,
  categoryBelongsToUser,
  listRules,
  upsertManualRule,
} from "@/lib/rules/repository";

/** List the signed-in user's categorization rules. */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok({ rules: await listRules(user.id) });
  } catch (error) {
    console.error("GET /api/rules failed:", error);
    return serverError();
  }
}

/** Create (or overwrite) a manual merchant→category rule, optionally applying it
 *  to existing matching transactions. */
export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const body = (await request.json().catch(() => null)) as {
      merchant?: unknown;
      categoryId?: unknown;
      apply?: unknown;
    } | null;
    const merchant = typeof body?.merchant === "string" ? body.merchant.trim() : "";
    const categoryId = typeof body?.categoryId === "string" ? body.categoryId : "";
    const apply = body?.apply === true;

    if (!merchant) return badRequest("Enter a merchant.");
    if (!categoryId) return badRequest("Pick a category.");
    if (!(await categoryBelongsToUser(user.id, categoryId))) return badRequest("Invalid category.");

    const rule = await upsertManualRule(user.id, merchant, categoryId);
    if (!rule) return badRequest("That merchant is too generic to make a rule.");

    const applied = apply ? await applyRuleToExisting(user.id, rule.pattern, categoryId) : 0;
    return ok({ id: rule.id, applied });
  } catch (error) {
    console.error("POST /api/rules failed:", error);
    return serverError();
  }
}
