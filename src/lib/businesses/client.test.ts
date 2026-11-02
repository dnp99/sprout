import { afterEach, expect, it, vi } from "vitest";
import { fetchBusinessActivity } from "./client";
const fetcher = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api", () => ({ fetchWithTimeout: fetcher }));
afterEach(() => fetcher.mockReset());
const page = (transactions: unknown[], hasMore = false, userId = "alex") => ({
  ok: true,
  json: async () => ({ transactions, hasMore, userId }),
});
it("loads every page and deduplicates boundary rows", async () => {
  fetcher
    .mockResolvedValueOnce(page([{ id: "a" }, { id: "b" }], true))
    .mockResolvedValueOnce(page([{ id: "b" }, { id: "c" }]));
  const rows = await fetchBusinessActivity("maple", "alex", new AbortController().signal);
  expect(rows.map((r) => r.id)).toEqual(["a", "b", "c"]);
  expect(fetcher.mock.calls[1][0]).toContain("offset=2");
});
it("rejects a changed account or incomplete page instead of returning partial financial totals", async () => {
  fetcher.mockResolvedValueOnce(page([{ id: "other" }], false, "taylor"));
  await expect(
    fetchBusinessActivity("maple", "alex", new AbortController().signal),
  ).rejects.toThrow("Account changed");
  fetcher.mockResolvedValueOnce(page([], true));
  await expect(
    fetchBusinessActivity("maple", "alex", new AbortController().signal),
  ).rejects.toThrow("Incomplete");
});
