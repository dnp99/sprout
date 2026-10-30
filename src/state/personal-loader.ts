import type { StoreApi } from "zustand/vanilla";
import { ApiResponseError, fetchSummary, fetchTransactions } from "@/lib/api";
import { withSummary, withTransactions } from "./reconcile";
import type { AppStore } from "./types";
export type LoadResult = "loaded" | "failed" | "cancelled" | "signed-out";

/** A document can resume after logout, an account change or a newer load. Both
 * phases share one generation so a late personal payload cannot cross accounts. */
export function createPersonalLoader(set: StoreApi<AppStore>["setState"], get: () => AppStore) {
  let generation = 0;
  let controller: AbortController | undefined;
  const cancel = () => {
    ++generation;
    controller?.abort();
  };
  async function load(): Promise<LoadResult> {
    cancel();
    controller = new AbortController();
    const signal = controller.signal,
      seq = generation;
    let user = get().user.id;
    const current = () => seq === generation && user === get().user.id;
    const expire = () => {
      get().clearSessionState();
      return "signed-out" as const;
    };
    try {
      const summary = await fetchSummary(signal);
      if (!current()) return "cancelled";
      if (get().flowStep === "done" && user && summary.user.id !== user) return expire();
      set((prev) => withSummary(prev, summary));
      user = summary.user.id;
    } catch (error) {
      if (!current() || signal.aborted) return "cancelled";
      if (error instanceof ApiResponseError && error.status === 401) return expire();
      set({ loaded: false, loadError: true });
      return "failed";
    }
    void fetchTransactions(signal)
      .then((transactions) => {
        if (current()) set((prev) => withTransactions(prev, transactions));
      })
      .catch((error) => {
        if (!current() || signal.aborted) return;
        if (error instanceof ApiResponseError && error.status === 401) expire();
        else set({ transactionsLoading: false });
      });
    return "loaded";
  }
  return { load, cancel };
}
