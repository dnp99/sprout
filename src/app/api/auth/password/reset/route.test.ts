import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "password-hash") }));
vi.mock("@/lib/auth/passwordReset", () => ({
  hashResetValue: vi.fn(() => "token-hash"),
  resetPasswordWithToken: vi.fn(async () => true),
}));

import { hashPassword } from "@/lib/auth/password";
import { hashResetValue, resetPasswordWithToken } from "@/lib/auth/passwordReset";
import { POST } from "./route";

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/password/reset", () => {
  it("rejects malformed tokens without hashing a password", async () => {
    const response = await POST(post({ newPassword: "longenough1" }));
    expect(response.status).toBe(400);
    expect(hashPassword).not.toHaveBeenCalled();
  });

  it("rejects a short password", async () => {
    const response = await POST(post({ token: "token", newPassword: "short" }));
    expect(response.status).toBe(400);
    expect(resetPasswordWithToken).not.toHaveBeenCalled();
  });

  it("consumes a valid token and changes the password", async () => {
    const response = await POST(post({ token: "token", newPassword: "longenough1" }));
    expect(response.status).toBe(200);
    expect(hashResetValue).toHaveBeenCalledWith("token");
    expect(resetPasswordWithToken).toHaveBeenCalledWith("token-hash", "password-hash");
  });

  it("uses the same invalid-link response for consumed or expired tokens", async () => {
    vi.mocked(resetPasswordWithToken).mockResolvedValueOnce(false);
    const response = await POST(post({ token: "token", newPassword: "longenough1" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("This reset link is invalid or has expired.");
  });
});
