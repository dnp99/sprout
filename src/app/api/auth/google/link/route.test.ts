import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  user: vi.fn(),
  token: vi.fn(),
  verify: vi.fn(),
  begin: vi.fn(),
  status: vi.fn(),
}));
vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: mock.user }));
vi.mock("@/lib/auth/cookies", () => ({ readSessionToken: mock.token }));
vi.mock("@/lib/auth/reauth", () => ({ verifyUserPassword: mock.verify }));
vi.mock("@/lib/auth/google-flow", () => ({ beginGoogleFlow: mock.begin }));
vi.mock("@/lib/auth/google-account", () => ({ googleLinkStatus: mock.status }));
vi.mock("@/lib/auth/google", () => ({
  googleConfig: () => ({ origin: "https://sprout.example" }),
}));
import { GET, POST } from "./route";
const userId = "00000000-0000-4000-8000-000000000001";
const post = (origin = "https://sprout.example") =>
  new Request("https://sprout.example/api/auth/google/link", {
    method: "POST",
    headers: { Origin: origin },
    body: JSON.stringify({ password: "example-password", returnPath: "/transactions" }),
  });
beforeEach(() => {
  vi.resetAllMocks();
  mock.user.mockResolvedValue({ id: userId });
  mock.token.mockResolvedValue("session");
  mock.verify.mockResolvedValue({ ok: true });
  mock.begin.mockResolvedValue("https://accounts.google.com/oauth");
});
it("requires authentication for status and rejects cross-site POSTs", async () => {
  expect((await POST(post("https://evil.example"))).status).toBe(403);
  mock.user.mockResolvedValue(null);
  expect((await GET()).status).toBe(401);
  expect(mock.begin).not.toHaveBeenCalled();
});
it("does not start linking without fresh password verification", async () => {
  mock.verify.mockResolvedValue({ ok: false });
  expect((await POST(post())).status).toBe(401);
  expect(mock.begin).not.toHaveBeenCalled();
});
it("binds a successful proof to this session and internal return path", async () => {
  expect((await POST(post())).status).toBe(200);
  expect(mock.verify).toHaveBeenCalledWith(userId, "example-password");
  expect(mock.begin).toHaveBeenCalledWith(
    expect.anything(),
    expect.objectContaining({
      userId,
      returnPath: "/transactions",
      sessionHash: expect.stringMatching(/^[a-f0-9]{64}$/),
    }),
  );
});

it.each([
  ["wrong_password", "password_invalid"],
  ["no_password", "password_missing"],
])("identifies %s only after session authentication", async (reason, code) => {
  mock.verify.mockResolvedValue({ ok: false, reason });
  const response = await POST(post());
  expect(response.status).toBe(401);
  expect(await response.json()).toEqual({ code });
  expect(mock.begin).not.toHaveBeenCalled();
});
it("distinguishes expired sessions without attempting password verification", async () => {
  mock.token.mockResolvedValue(null);
  expect(await (await POST(post())).json()).toEqual({ code: "session_expired" });
  expect(mock.verify).not.toHaveBeenCalled();
});
