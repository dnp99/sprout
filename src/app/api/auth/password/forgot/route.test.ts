import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/passwordReset", () => ({
  normalizeEmail: vi.fn((value) =>
    typeof value === "string" && value.includes("@") ? value.toLowerCase() : null,
  ),
  allowPasswordResetRequest: vi.fn(async () => false),
  createPasswordResetToken: vi.fn(),
  createResetToken: vi.fn(),
  hashResetValue: vi.fn(),
  invalidatePasswordResetToken: vi.fn(),
  resetExpiry: vi.fn(),
}));
vi.mock("@/db", () => ({ getDb: vi.fn() }));
vi.mock("@/lib/email/passwordReset", () => ({
  passwordResetUrl: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
}));

import { allowPasswordResetRequest } from "@/lib/auth/passwordReset";
import { POST } from "./route";

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/password/forgot", () => {
  it("returns the same generic confirmation for malformed and rate-limited requests", async () => {
    const malformed = await POST(post({ email: "bad" }));
    const limited = await POST(post({ email: "person@example.com" }));
    expect(malformed.status).toBe(200);
    expect(limited.status).toBe(200);
    expect(await malformed.json()).toEqual(await limited.json());
    expect(allowPasswordResetRequest).toHaveBeenCalledWith("person@example.com", "unknown");
  });
});

it("allows Google-only accounts to establish a password while leaving legacy passwordless rows excluded", async () => {
  const { getDb } = await import("@/db");
  const { sendPasswordResetEmail } = await import("@/lib/email/passwordReset");
  vi.mocked(allowPasswordResetRequest).mockResolvedValue(true);
  const limit = vi.fn().mockResolvedValue([
    {
      id: "google-user",
      email: "alex@example.test",
      passwordHash: null,
      googleSubject: "subject",
    },
  ]);
  vi.mocked(getDb).mockReturnValue({
    select: () => ({ from: () => ({ where: () => ({ limit }) }) }),
  } as unknown as ReturnType<typeof getDb>);
  await POST(post({ email: "alex@example.test" }));
  expect(sendPasswordResetEmail).toHaveBeenCalledOnce();
  vi.mocked(sendPasswordResetEmail).mockClear();
  limit.mockResolvedValue([{ id: "legacy", email: "alex@example.test", passwordHash: null }]);
  await POST(post({ email: "alex@example.test" }));
  expect(sendPasswordResetEmail).not.toHaveBeenCalled();
});
