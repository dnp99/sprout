import { afterEach, expect, it, vi } from "vitest";
import { createStore } from "zustand/vanilla";
import { fetchSummary } from "@/lib/api";
import type { SummaryData } from "@/lib/api";
import { initialState } from "./initial";
import type { AppStore } from "./types";
import { withSummary } from "./reconcile";
import { createPersonalLoader } from "./personal-loader";
vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  fetchSummary: vi.fn(),
  fetchTransactions: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
it("does not re-enter transaction loading for an already loaded empty ledger", () => {
  const state = { ...initialState(), loaded: true, transactionsLoading: false } as AppStore;
  const summary = {
    user: state.user,
    categories: [],
    summary: state.summary,
    goals: [],
    recurring: [],
    incomeSources: [],
    businesses: [],
  } as SummaryData;
  expect(withSummary(state, summary).transactionsLoading).toBe(false);
  expect(withSummary({ ...state, loaded: false }, summary).transactionsLoading).toBe(true);
});
it.each([false, true])(
  "preserves cached Personal data on failed refresh (loaded: %s)",
  async (loaded) => {
    const s = createStore<AppStore>()(
      () => ({ ...initialState(), loaded, flowStep: "done" }) as AppStore,
    );
    vi.mocked(fetchSummary).mockRejectedValueOnce(new TypeError("offline"));
    const loader = createPersonalLoader(s.setState, s.getState);
    expect(await loader.load()).toBe("failed");
    expect(s.getState().loaded).toBe(loaded);
    expect(s.getState().loadError).toBe(!loaded);
  },
);
