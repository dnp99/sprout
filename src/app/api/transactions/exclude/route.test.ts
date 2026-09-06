import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/transactions/repository", () => ({ setTransactionsBudgetExclusion: vi.fn() }));

import { getSessionUser } from "@/lib/auth/currentUser";
import { setTransactionsBudgetExclusion } from "@/lib/transactions/repository";
import { POST } from "./route";

const post = (body: unknown) =>
  new Request("http://test/api", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue({ id: "u1" } as never);
  vi.mocked(setTransactionsBudgetExclusion).mockResolvedValue(2);
});

describe("POST /api/transactions/exclude", () => {
  it("requires authentication", async () => {
    vi.mocked(getSessionUser).mockResolvedValueOnce(null);
    expect((await POST(post({ ids: ["t1"] }))).status).toBe(401);
  });

  it("requires at least one id", async () => {
    expect((await POST(post({ ids: [] }))).status).toBe(400);
    expect(setTransactionsBudgetExclusion).not.toHaveBeenCalled();
  });

  it("scopes a bulk exclusion to the signed-in user", async () => {
    const response = await POST(post({ ids: ["t1", "t2"] }));
    expect(response.status).toBe(200);
    expect(setTransactionsBudgetExclusion).toHaveBeenCalledWith("u1", ["t1", "t2"], true);
    expect(await response.json()).toEqual({ count: 2 });
  });

  it("can restore selected rows to the budget", async () => {
    const response = await POST(post({ ids: ["t1"], exclude: false }));
    expect(response.status).toBe(200);
    expect(setTransactionsBudgetExclusion).toHaveBeenCalledWith("u1", ["t1"], false);
  });
});
