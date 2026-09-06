import { getSessionUser } from "@/lib/auth/currentUser";
import { badRequest, notFound, ok, serverError, unauthorized } from "@/lib/http";
import { deleteIncomeSource, updateIncomeSource } from "@/lib/income-sources/repository";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const { id } = await params;
    const incomeSource = await updateIncomeSource(user.id, id, {
      name,
      emoji: emoji || "💰",
      expectedMonthlyCents,
    });
    return incomeSource ? ok({ incomeSource }) : notFound("Income source not found.");
  } catch (error) {
    console.error("PATCH /api/income-sources/[id] failed:", error);
    return serverError();
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();
    const { id } = await params;
    return (await deleteIncomeSource(user.id, id))
      ? ok({ ok: true })
      : notFound("Income source not found.");
  } catch (error) {
    console.error("DELETE /api/income-sources/[id] failed:", error);
    return serverError();
  }
}
