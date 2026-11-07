import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  get: vi.fn(),
  delete: vi.fn(),
  getToken: vi.fn(),
  verify: vi.fn(),
  account: vi.fn(),
  session: vi.fn(),
  cookie: vi.fn(),
  current: vi.fn(),
  token: vi.fn(),
  link: vi.fn(),
}));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: mock.get, delete: mock.delete }) }));
vi.mock("@/lib/auth/google", async (original) => ({
  ...(await original<typeof import("@/lib/auth/google")>()),
  googleConfig: () => ({
    clientId: "client",
    clientSecret: "secret",
    origin: "https://sprout.example",
    redirectUri: "https://sprout.example/api/auth/google/callback",
  }),
  googleClient: () => ({ getToken: mock.getToken, verifyIdToken: mock.verify }),
}));
vi.mock("@/lib/auth/google-account", () => ({
  googleAccount: mock.account,
  GoogleAccountExists: class extends Error {},
  GoogleLinkError: class extends Error {},
  linkGoogleAccount: mock.link,
}));
vi.mock("@/lib/auth/sessionRepository", () => ({ createSession: mock.session }));
vi.mock("@/lib/auth/cookies", () => ({
  setSessionCookie: mock.cookie,
  readSessionToken: mock.token,
}));
vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: mock.current }));
import { newGoogleFlow, serializeGoogleFlow } from "@/lib/auth/google";
import { GET } from "./route";
beforeEach(() => vi.resetAllMocks());
it("rejects unsolicited callbacks before token exchange or account access", async () => {
  const response = await GET(
    new Request("https://sprout.example/api/auth/google/callback?code=code&state=bad"),
  );
  expect(response.headers.get("location")).toContain("google_error=failed");
  expect(mock.getToken).not.toHaveBeenCalled();
  expect(mock.account).not.toHaveBeenCalled();
  expect(mock.delete).toHaveBeenCalled();
});
it("exchanges with PKCE, verifies audience and nonce, then issues the existing session", async () => {
  const flow = newGoogleFlow();
  mock.get.mockReturnValue({ value: serializeGoogleFlow(flow, "secret") });
  mock.getToken.mockResolvedValue({ tokens: { id_token: "verified-token" } });
  mock.verify.mockResolvedValue({
    getPayload: () => ({
      sub: "subject",
      email: "alex@example.test",
      name: "Alex",
      email_verified: true,
      nonce: flow.nonce,
    }),
  });
  mock.account.mockResolvedValue({ id: "user" });
  mock.session.mockResolvedValue({ token: "session", expiresAt: new Date(0) });
  const response = await GET(
    new Request(`https://sprout.example/api/auth/google/callback?code=code&state=${flow.state}`),
  );
  expect(mock.getToken).toHaveBeenCalledWith(
    expect.objectContaining({ codeVerifier: flow.verifier }),
  );
  expect(mock.verify).toHaveBeenCalledWith({ idToken: "verified-token", audience: "client" });
  expect(mock.cookie).toHaveBeenCalledWith("session", new Date(0));
  expect(response.headers.get("location")).toBe("https://sprout.example/home");
});
it("does not issue a session when the ID token nonce is invalid", async () => {
  const flow = newGoogleFlow();
  mock.get.mockReturnValue({ value: serializeGoogleFlow(flow, "secret") });
  mock.getToken.mockResolvedValue({ tokens: { id_token: "token" } });
  mock.verify.mockResolvedValue({
    getPayload: () => ({
      sub: "subject",
      email: "alex@example.test",
      email_verified: true,
      nonce: "wrong",
    }),
  });
  await GET(
    new Request(`https://sprout.example/api/auth/google/callback?code=code&state=${flow.state}`),
  );
  expect(mock.account).not.toHaveBeenCalled();
  expect(mock.session).not.toHaveBeenCalled();
});

it.each(["same", "switched", "expired", "rotated"])(
  "links only into the original authenticated session (%s)",
  async (scenario) => {
    const { googleSessionHash } = await import("@/lib/auth/google-link");
    const userId = "00000000-0000-4000-8000-000000000001";
    const flow = newGoogleFlow(Date.now(), {
      userId,
      sessionHash: googleSessionHash("session-before"),
      returnPath: "/transactions",
    });
    mock.get.mockReturnValue({ value: serializeGoogleFlow(flow, "secret") });
    mock.getToken.mockResolvedValue({ tokens: { id_token: "token" } });
    mock.verify.mockResolvedValue({
      getPayload: () => ({
        sub: "subject",
        email: "alex@example.test",
        email_verified: true,
        nonce: flow.nonce,
      }),
    });
    mock.current.mockResolvedValue(
      scenario === "expired" ? null : { id: scenario === "switched" ? "other-user" : userId },
    );
    mock.token.mockResolvedValue(scenario === "rotated" ? "different-session" : "session-before");
    const response = await GET(
      new Request(`https://sprout.example/api/auth/google/callback?code=code&state=${flow.state}`),
    );
    if (scenario === "same") {
      expect(mock.link).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ subject: "subject" }),
      );
      expect(response.headers.get("location")).toBe(
        "https://sprout.example/transactions?google_link=success",
      );
    } else {
      expect(mock.link).not.toHaveBeenCalled();
      expect(response.headers.get("location")).toContain("google_link=failed");
    }
    expect(mock.account).not.toHaveBeenCalled();
    expect(mock.session).not.toHaveBeenCalled();
    expect(mock.cookie).not.toHaveBeenCalled();
  },
);
