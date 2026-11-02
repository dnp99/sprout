import { beforeEach, expect, it, vi } from "vitest";
vi.mock("@/lib/auth/currentUser", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/businesses/repository", () => ({ userOwnsBusiness: vi.fn() }));
vi.mock("@/lib/transactions/repository", () => ({
  listRecentTransactions: vi.fn(),
  createTransaction: vi.fn(),
}));
import { getSessionUser } from "@/lib/auth/currentUser";
import { userOwnsBusiness } from "@/lib/businesses/repository";
import { listRecentTransactions } from "@/lib/transactions/repository";
import { GET } from "./route";
const business = "00000000-0000-4000-8000-000000000001";
const request = (params = "") => new Request(`http://localhost/api/transactions?${params}`);
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue({ id: "alex" } as never);
  vi.mocked(userOwnsBusiness).mockResolvedValue(true);
  vi.mocked(listRecentTransactions).mockResolvedValue([]);
});
it("authorizes a business before querying and never accepts another account's id", async () => {
  vi.mocked(userOwnsBusiness).mockResolvedValue(false);
  expect((await GET(request(`businessId=${business}`))).status).toBe(400);
  expect(listRecentTransactions).not.toHaveBeenCalled();
  expect((await GET(request("businessId=invalid"))).status).toBe(400);
  vi.mocked(getSessionUser).mockResolvedValue(null);
  expect((await GET(request())).status).toBe(401);
});
it("returns bounded pages with account identity and a hasMore marker", async () => {
  vi.mocked(listRecentTransactions).mockResolvedValue([
    { id: "a" },
    { id: "b" },
    { id: "next" },
  ] as never);
  const response = await GET(request(`businessId=${business}&limit=2&offset=4`));
  expect(listRecentTransactions).toHaveBeenCalledWith("alex", 3, business, 4);
  expect(await response.json()).toEqual({
    transactions: [{ id: "a" }, { id: "b" }],
    hasMore: true,
    userId: "alex",
  });
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("validates offsets and scopes unassigned activity without a foreign business lookup", async () => {
  expect((await GET(request("businessId=__no_business__&offset=-1"))).status).toBe(400);
  await GET(request("businessId=__no_business__&limit=500"));
  expect(userOwnsBusiness).not.toHaveBeenCalled();
  expect(listRecentTransactions).toHaveBeenCalledWith("alex", 501, "__no_business__", 0);
});
