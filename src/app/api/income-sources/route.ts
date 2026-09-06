import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, ok, serverError, unauthorized } from "@/lib/http";
import { createIncomeSource, listIncomeSources } from "@/lib/income-sources/repository";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    return ok({ incomeSources: await listIncomeSources(user.id) });
  } catch (error) {
    console.error("GET /api/income-sources failed:", error);
    return serverError();
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const body = (await request.json().catch(() => null)) as {
      name?: unknown;
      emoji?: unknown;
      expectedMonthlyCents?: unknown;
    } | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const emoji = typeof body?.emoji === "string" ? body.emoji.trim() : "";
    const expectedMonthlyCents = body?.expectedMonthlyCents;
    if (!name || name.length > 60) return badRequest("Income source name must be 1–60 characters.");
    if (
      typeof expectedMonthlyCents !== "number" ||
      !Number.isSafeInteger(expectedMonthlyCents) ||
      expectedMonthlyCents < 0
    ) {
      return badRequest("Expected income must be a non-negative whole number of cents.");
    }
    return ok(
      {
        incomeSource: await createIncomeSource(user.id, name, emoji || "💰", expectedMonthlyCents),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/income-sources failed:", error);
    return serverError();
  }
}
