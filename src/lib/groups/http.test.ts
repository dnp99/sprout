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

it("accepts the browser Host when Next normalizes a loopback URL", async () => {
  vi.mocked(getSessionUser).mockResolvedValue({ id: "user" } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
  const run = vi.fn().mockResolvedValue({ ok: true });
  const response = await groupRequest(
    new Request("http://localhost:3000/api/groups", {
      method: "POST",
      headers: { host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" },
    }),
    run,
  );
  expect(response.status).toBe(200);
  expect(run).toHaveBeenCalledWith("user");
});
it("still rejects a different port, missing origin and forged forwarded host", async () => {
  vi.mocked(getSessionUser).mockResolvedValue({ id: "user" } as Awaited<
    ReturnType<typeof getSessionUser>
  >);
  for (const extra of [
    { origin: "http://127.0.0.1:4000" },
    {},
    { origin: "https://evil.test", "x-forwarded-host": "evil.test" },
  ] as Record<string, string>[]) {
    const run = vi.fn();
    const response = await groupRequest(
      new Request("http://localhost:3000/api/groups", {
        method: "POST",
        headers: { host: "127.0.0.1:3000", ...extra },
      }),
      run,
    );
    expect(response.status).toBe(403);
    expect(run).not.toHaveBeenCalled();
  }
});
