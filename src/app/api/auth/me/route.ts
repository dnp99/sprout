import { getSessionUser } from "@/lib/auth/currentUser";
import { ok, unauthorized } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  return ok({ user });
}
