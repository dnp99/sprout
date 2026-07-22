import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock every dependency the routes touch, so we test the guard logic (reauth +
// confirmation) without a database.
vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/auth/reauth", () => ({ verifyUserPassword: vi.fn() }));
vi.mock("@/lib/auth/account", () => ({ updateUserPassword: vi.fn(), deleteUser: vi.fn() }));
vi.mock("@/lib/auth/cookies", () => ({
  readSessionToken: vi.fn(async () => "current-token"),
  clearSessionCookie: vi.fn(),
}));
vi.mock("@/lib/auth/sessionRepository", () => ({ revokeOtherSessions: vi.fn(async () => 2) }));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "new-hash") }));

import { getSessionUser } from "@/lib/auth/currentUser";
import { verifyUserPassword } from "@/lib/auth/reauth";
import { deleteUser, updateUserPassword } from "@/lib/auth/account";
import { clearSessionCookie } from "@/lib/auth/cookies";
import { revokeOtherSessions } from "@/lib/auth/sessionRepository";
import { POST as changePassword } from "./password/route";
import { POST as deleteAccount } from "./delete/route";
import { POST as revokeOthers } from "./sessions/revoke-others/route";

const user = { id: "u1", name: "Sam", email: "sam@sprout.money" };
const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(user as never);
  vi.mocked(verifyUserPassword).mockResolvedValue({ ok: true });
});

describe("POST /api/auth/password", () => {
  it("401s when not signed in", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    const res = await changePassword(post({ currentPassword: "old", newPassword: "longenough1" }));
    expect(res.status).toBe(401);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("400s a too-short new password", async () => {
    const res = await changePassword(post({ currentPassword: "old", newPassword: "short" }));
    expect(res.status).toBe(400);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("400s when the new password equals the current one", async () => {
    const res = await changePassword(
      post({ currentPassword: "samesame1", newPassword: "samesame1" }),
    );
    expect(res.status).toBe(400);
  });

  it("401s on the wrong current password (no write)", async () => {
    vi.mocked(verifyUserPassword).mockResolvedValueOnce({ ok: false, reason: "wrong_password" });
    const res = await changePassword(post({ currentPassword: "nope", newPassword: "longenough1" }));
    expect(res.status).toBe(401);
    expect(updateUserPassword).not.toHaveBeenCalled();
  });

  it("updates the password and revokes other sessions on success", async () => {
    const res = await changePassword(post({ currentPassword: "old", newPassword: "longenough1" }));
    expect(res.status).toBe(200);
    expect(updateUserPassword).toHaveBeenCalledWith("u1", "new-hash");
    expect(revokeOtherSessions).toHaveBeenCalledWith("u1", "current-token");
    expect(await res.json()).toMatchObject({ ok: true, revoked: 2 });
  });
});

describe("POST /api/auth/delete", () => {
  it("401s when not signed in", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    const res = await deleteAccount(post({ password: "pw", confirm: "DELETE" }));
    expect(res.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("400s without the exact DELETE confirmation (no delete)", async () => {
    const res = await deleteAccount(post({ password: "pw", confirm: "delete" }));
    expect(res.status).toBe(400);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("401s on the wrong password (no delete)", async () => {
    vi.mocked(verifyUserPassword).mockResolvedValueOnce({ ok: false, reason: "wrong_password" });
    const res = await deleteAccount(post({ password: "nope", confirm: "DELETE" }));
    expect(res.status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("deletes the account and clears the cookie on success", async () => {
    const res = await deleteAccount(post({ password: "pw", confirm: "DELETE" }));
    expect(res.status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith("u1");
    expect(clearSessionCookie).toHaveBeenCalled();
  });
});

describe("POST /api/auth/sessions/revoke-others", () => {
  it("401s when not signed in", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    const res = await revokeOthers();
    expect(res.status).toBe(401);
    expect(revokeOtherSessions).not.toHaveBeenCalled();
  });

  it("revokes other sessions for the signed-in user", async () => {
    const res = await revokeOthers();
    expect(res.status).toBe(200);
    expect(revokeOtherSessions).toHaveBeenCalledWith("u1", "current-token");
  });
});
