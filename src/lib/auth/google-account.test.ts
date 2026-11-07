import { beforeEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  limit: vi.fn(),
  insert: vi.fn(),
  values: vi.fn(),
  returning: vi.fn(),
}));
vi.mock("@/db", () => ({
  getDb: () => ({
    transaction: (run: (tx: unknown) => unknown) =>
      run({
        select: () => ({ from: () => ({ where: () => ({ limit: mock.limit }) }) }),
        insert: mock.insert,
      }),
  }),
}));
import { googleAccount, GoogleAccountExists } from "./google-account";
const identity = { subject: "stable-subject", email: "alex@example.test", name: "Alex" };
beforeEach(() => {
  vi.resetAllMocks();
  mock.insert.mockReturnValue({ values: mock.values });
  mock.values.mockReturnValue({ returning: mock.returning });
});
it("signs in only by the stored subject and does not create duplicate records", async () => {
  mock.limit.mockResolvedValueOnce([{ id: "existing" }]);
  expect(await googleAccount(identity)).toEqual({ id: "existing" });
  expect(mock.insert).not.toHaveBeenCalled();
});
it("refuses email-only linking to an existing financial account", async () => {
  mock.limit.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "password-user" }]);
  await expect(googleAccount(identity)).rejects.toBeInstanceOf(GoogleAccountExists);
  expect(mock.insert).not.toHaveBeenCalled();
});
it("provisions a new subject and starter categories together", async () => {
  mock.limit.mockResolvedValue([]);
  mock.returning.mockResolvedValue([{ id: "new-user" }]);
  await googleAccount(identity);
  expect(mock.values).toHaveBeenNthCalledWith(1, {
    name: "Alex",
    email: "alex@example.test",
    googleSubject: "stable-subject",
  });
  expect(mock.values.mock.calls[1][0]).toEqual(
    expect.arrayContaining([expect.objectContaining({ userId: "new-user" })]),
  );
});
