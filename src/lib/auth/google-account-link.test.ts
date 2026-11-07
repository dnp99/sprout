import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  lock: vi.fn(),
  limit: vi.fn(),
  update: vi.fn(),
  set: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/db", () => ({
  getDb: () => ({
    transaction: (run: (tx: unknown) => unknown) =>
      run({
        select: () => ({ from: () => ({ where: () => ({ for: mock.lock, limit: mock.limit }) }) }),
        update: mock.update,
      }),
  }),
}));
import { linkGoogleAccount, GoogleLinkError } from "./google-account";
const identity = { subject: "verified-subject", email: "alex@example.test" };
beforeEach(() => {
  vi.resetAllMocks();
  mock.lock.mockResolvedValue([{ id: "user", email: "alex@example.test", googleSubject: null }]);
  mock.limit.mockResolvedValue([]);
  mock.update.mockReturnValue({ set: mock.set });
  mock.set.mockReturnValue({ where: mock.where });
});
it("updates only the existing account identity without provisioning data", async () => {
  await linkGoogleAccount("user", identity);
  expect(mock.lock).toHaveBeenCalledWith("update");
  expect(mock.set).toHaveBeenCalledWith({
    googleSubject: "verified-subject",
    updatedAt: expect.any(Date),
  });
  expect(mock.update).toHaveBeenCalledOnce();
});
it("rejects a Google email different from the authenticated account", async () => {
  await expect(
    linkGoogleAccount("user", { ...identity, email: "taylor@example.test" }),
  ).rejects.toMatchObject({ reason: "email" });
  expect(mock.update).not.toHaveBeenCalled();
});
it("never replaces a different linked Google account", async () => {
  mock.lock.mockResolvedValue([
    { id: "user", email: "alex@example.test", googleSubject: "other-subject" },
  ]);
  await expect(linkGoogleAccount("user", identity)).rejects.toBeInstanceOf(GoogleLinkError);
  expect(mock.update).not.toHaveBeenCalled();
});
it("rejects a subject already owned by another Sprout user", async () => {
  mock.limit.mockResolvedValue([{ id: "other-user" }]);
  await expect(linkGoogleAccount("user", identity)).rejects.toMatchObject({ reason: "conflict" });
  expect(mock.update).not.toHaveBeenCalled();
});
it("allows an idempotent link to the same subject and account", async () => {
  mock.lock.mockResolvedValue([
    { id: "user", email: "alex@example.test", googleSubject: identity.subject },
  ]);
  mock.limit.mockResolvedValue([{ id: "user" }]);
  await linkGoogleAccount("user", identity);
  expect(mock.update).toHaveBeenCalledOnce();
});
