import { beforeEach, it, expect, vi } from "vitest";
import { groupRequest, groupBody } from "./http";
import { getSessionUser } from "@/lib/auth/currentUser";
vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
beforeEach(() => vi.mocked(getSessionUser).mockReset());
it("does not invoke group operations without a session", async () => {
  vi.mocked(getSessionUser).mockResolvedValue(null);
  const run = vi.fn();
  const res = await groupRequest(new Request("https://sprout.test/api/groups"), run);
  expect(res.status).toBe(401);
  expect(run).not.toHaveBeenCalled();
});
it("rejects cross-origin authenticated writes before invoking the repository", async () => {
  vi.mocked(getSessionUser).mockResolvedValue({ id: "user" } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
  const run = vi.fn();
  const res = await groupRequest(
    new Request("https://sprout.test/api/groups", {
      method: "POST",
      headers: { origin: "https://other.test" },
    }),
    run,
  );
  expect(res.status).toBe(403);
  expect(run).not.toHaveBeenCalled();
});
it("caps bodies and rejects malformed JSON", async () => {
  await expect(
    groupBody(new Request("https://sprout.test", { method: "POST", body: "x".repeat(32001) })),
  ).rejects.toMatchObject({ status: 413 });
  await expect(
    groupBody(new Request("https://sprout.test", { method: "POST", body: "{" })),
  ).rejects.toMatchObject({ status: 400 });
});
