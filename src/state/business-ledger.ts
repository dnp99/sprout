import type { StoreApi } from "zustand/vanilla";
import { fetchBusinessActivity } from "@/lib/businesses/client";
import type { Transaction } from "@/lib/types";
import type { AppStore } from "./types";

export interface BusinessLedgerState {
  businessLedger: {
    id: string;
    userId: string;
    rows: Transaction[];
    loading: boolean;
    error: boolean;
  } | null;
  loadBusinessLedger: (id: string, retry?: boolean) => Promise<void>;
  clearBusinessLedger: () => void;
}
/** Per-store request/cache ownership deduplicates desktop/mobile mounts and rejects stale account responses. */
export function businessLedgerSlice(
  set: StoreApi<AppStore>["setState"],
  get: () => AppStore,
): BusinessLedgerState {
  let controller: AbortController | undefined;
  let source: Transaction[] | undefined;
  let generation = 0;
  return {
    businessLedger: null,
    clearBusinessLedger: () => {
      ++generation;
      controller?.abort();
      source = undefined;
      set({ businessLedger: null });
    },
    loadBusinessLedger: async (id, retry = false) => {
      const userId = get().user.id;
      const current = get().businessLedger;
      if (
        !retry &&
        current?.id === id &&
        current.userId === userId &&
        source === get().transactions
      )
        return;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal,
        seq = ++generation;
      source = get().transactions;
      set({ businessLedger: { id, userId, rows: [], loading: true, error: false } });
      try {
        const rows = await fetchBusinessActivity(id, userId, signal);
        if (seq !== generation || get().user.id !== userId || get().flowStep !== "done") return;
        // Old business records must remain editable by the shared transaction detail/actions.
        const merged = new Map(get().transactions.map((row) => [row.id, row]));
        rows.forEach((row) => merged.set(row.id, row));
        source = [...merged.values()];
        set({
          transactions: source,
          businessLedger: { id, userId, rows, loading: false, error: false },
        });
      } catch {
        if (seq !== generation || signal.aborted || get().user.id !== userId) return;
        set({ businessLedger: { id, userId, rows: [], loading: false, error: true } });
      }
    },
  };
}
