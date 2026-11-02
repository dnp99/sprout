import { createStore } from "zustand/vanilla";
import { afterEach, expect, it, vi } from "vitest";
import { businessLedgerSlice } from "./business-ledger";
import type { AppStore } from "./types";
import type { Transaction } from "@/lib/types";
const fetcher = vi.hoisted(() => vi.fn());
vi.mock("@/lib/businesses/client", () => ({ fetchBusinessActivity: fetcher }));
afterEach(() => fetcher.mockReset());
const fixture = () =>
  createStore<AppStore>()(
    (set, get) =>
      ({
        user: { id: "alex" },
        transactions: [],
        flowStep: "done",
        ...businessLedgerSlice(set, get),
      }) as unknown as AppStore,
  );
it("deduplicates responsive mounts and merges older records for shared editing", async () => {
  let resolve!: (value: Transaction[]) => void;
  fetcher.mockReturnValue(
    new Promise<Transaction[]>((r) => {
      resolve = r;
    }),
  );
  const store = fixture();
  const load = store.getState().loadBusinessLedger("maple");
  await store.getState().loadBusinessLedger("maple");
  expect(fetcher).toHaveBeenCalledOnce();
  resolve([{ id: "old" }] as Transaction[]);
  await load;
  expect(store.getState().transactions[0].id).toBe("old");
  await store.getState().loadBusinessLedger("maple");
  expect(fetcher).toHaveBeenCalledOnce();
});
it("drops late responses after logout and never leaks the previous account's business data", async () => {
  let resolve!: (value: Transaction[]) => void;
  fetcher.mockReturnValue(
    new Promise<Transaction[]>((r) => {
      resolve = r;
    }),
  );
  const store = fixture();
  const load = store.getState().loadBusinessLedger("maple");
  store.getState().clearBusinessLedger();
  store.setState({ user: { id: "taylor" } as AppStore["user"] });
  resolve([{ id: "private" }] as Transaction[]);
  await load;
  expect(store.getState().businessLedger).toBeNull();
  expect(store.getState().transactions).toEqual([]);
});
it("retains an explicit retry state on failure and reloads when the source changes", async () => {
  fetcher.mockRejectedValueOnce(new Error("Offline")).mockResolvedValue([]);
  const store = fixture();
  await store.getState().loadBusinessLedger("maple");
  expect(store.getState().businessLedger?.error).toBe(true);
  await store.getState().loadBusinessLedger("maple", true);
  expect(store.getState().businessLedger?.error).toBe(false);
  store.setState({ transactions: [] });
  await store.getState().loadBusinessLedger("maple");
  expect(fetcher).toHaveBeenCalledTimes(3);
});
