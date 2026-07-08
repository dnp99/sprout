"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
  type SummaryData,
  categorizeBacklogApi,
  sweepRoundupsApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
  updateBudgetPoolApi,
  createGoal as apiCreateGoal,
  createRecurring as apiCreateRecurring,
  deleteGoalApi,
  deleteRecurringApi,
  deleteTransaction as apiDeleteTransaction,
  bulkCategorizeApi,
  updateGoalApi,
  updateRecurringApi,
  updateProfile as apiUpdateProfile,
  patchTransaction,
  fetchSummary,
  fetchTransactions,
  postTransaction,
} from "@/lib/api";
import { toRecurringInput } from "@/lib/recurring/input";
import type { Transaction } from "@/lib/types";
import { BUDGET_STEP, initialState } from "./initial";
import type { AppState, AppStore } from "./types";

type AppStoreApi = StoreApi<AppStore>;

/** Phase 1: merge the summary payload (everything but transactions) and paint
 *  the shell. Seeds webBudgets from category budgets on the first load only (so
 *  later refetches don't wipe in-progress budget edits). Flags transactions as
 *  loading only when we don't already have them (so a refresh keeps stale rows
 *  on screen instead of flashing skeletons). */
function withSummary(prev: AppState, data: SummaryData): Partial<AppState> {
  return {
    user: data.user,
    categories: data.categories,
    summary: data.summary,
    goals: data.goals,
    recurring: data.recurring,
    loaded: true,
    loadError: false,
    transactionsLoading: prev.transactions.length === 0,
    selectedCategoryId: prev.selectedCategoryId || data.categories[0]?.id || "",
    addCategoryId: data.categories.some((c) => c.id === prev.addCategoryId)
      ? prev.addCategoryId
      : (data.categories.find((c) => c.id !== "bills")?.id ?? prev.addCategoryId),
    webBudgets: prev.loaded
      ? prev.webBudgets
      : Object.fromEntries(data.categories.map((c) => [c.id, c.monthlyBudgetCents])),
  };
}

/** Phase 2: merge the transaction set once it arrives. */
function withTransactions(prev: AppState, transactions: Transaction[]): Partial<AppState> {
  return {
    transactions,
    transactionsLoading: false,
    selectedTxnId: prev.selectedTxnId || transactions[0]?.id || "",
  };
}

/** Build a fresh store instance. Per-provider (one per request on the server) so
 *  there's no cross-request state bleed. `set` merges shallowly (Zustand default),
 *  and `get()` gives the always-current snapshot inside async thunks/timers —
 *  which is why no `stateRef` mirror is needed anymore. */
function createAppStore(): AppStoreApi {
  return createStore<AppStore>()((set, get) => {
    // Debounce DB writes per category so rapid stepper clicks / typing persist
    // once the user pauses, then refresh so the summary (total budget) updates.
    const budgetTimers = new Map<string, ReturnType<typeof setTimeout>>();
    let poolTimer: ReturnType<typeof setTimeout> | null = null;

    // Internal — the public API exposes this as `refresh`. Kept as a closure
    // local so thunks and the debounced persisters can call it directly.
    const load = async () => {
      // Phase 1 — summary paints the shell fast. Await this so the auth gate
      // resolves as soon as the light payload lands.
      try {
        const summary = await fetchSummary();
        set((prev) => withSummary(prev, summary));
      } catch {
        // Summary failed after auth — surface an error screen rather than
        // rendering stale/fake data.
        set({ loaded: false, loadError: true });
        return;
      }
      // Phase 2 — stream the (large) transaction set in the background; widgets
      // that need it show skeletons until it arrives. A failure here leaves the
      // shell up with empty transaction widgets rather than a full error screen.
      fetchTransactions()
        .then((transactions) => set((prev) => withTransactions(prev, transactions)))
        .catch(() => set({ transactionsLoading: false }));
    };

    const persistBudget = (id: string) => {
      const existing = budgetTimers.get(id);
      if (existing) clearTimeout(existing);
      budgetTimers.set(
        id,
        setTimeout(() => {
          budgetTimers.delete(id);
          const cat = get().categories.find((c) => c.id === id);
          const cents = get().webBudgets[id];
          if (!cat || cents === undefined) return;
          void updateCategoryApi(id, {
            name: cat.name,
            emoji: cat.emoji,
            color: cat.color,
            monthlyBudgetCents: cents,
          }).then(() => load());
        }, 600),
      );
    };

    return {
      ...initialState(),

      set: (patch) => set(patch),
      goMobile: (screen) => set({ mobileScreen: screen }),
      openCategory: (id) => set({ selectedCategoryId: id, mobileScreen: "catDetail" }),
      openTransaction: (id) => set({ selectedTxnId: id, mobileScreen: "txnDetail" }),
      resetAdd: () =>
        set({ addAmountCents: 0, addMerchant: "", addRecurring: false, addMode: "expense" }),

      pressKey: (key) =>
        set((prev) => {
          if (key === "back") return { addAmountCents: Math.floor(prev.addAmountCents / 10) };
          // Returning the same state is a true no-op in Zustand (Object.is skips
          // the notify), matching the previous reducer's `return prev`.
          if (key === ".") return prev;
          const digit = Number(key);
          if (!Number.isInteger(digit)) return prev;
          return { addAmountCents: Math.min(prev.addAmountCents * 10 + digit, 99_999_99) };
        }),

      commitAdd: async () => {
        const prev = get();
        const magnitude = prev.addAmountCents;
        const isIncome = prev.addMode === "income";
        const categoryId = isIncome ? null : prev.addCategoryId;
        const merchant = prev.addMerchant.trim();
        set({
          addAmountCents: 0,
          addMerchant: "",
          addRecurring: false,
          mobileScreen: "home",
          webAddOpen: false,
        });

        if (magnitude <= 0) return;
        try {
          await postTransaction({
            merchant: merchant || (isIncome ? "Income" : "Expense"),
            amountCents: isIncome ? magnitude : -magnitude,
            categoryId,
          });
          await load();
        } catch {
          // Best-effort: ignore transient write failures.
        }
      },

      toggleRecurring: async (id) => {
        const item = get().recurring.find((r) => r.id === id);
        if (!item) return;
        await updateRecurringApi(id, toRecurringInput({ ...item, paused: !item.paused }));
        await load();
      },

      saveRecurring: async (input, id) => {
        if (id) await updateRecurringApi(id, input);
        else await apiCreateRecurring(input);
        await load();
      },

      removeRecurring: async (id) => {
        await deleteRecurringApi(id);
        await load();
      },

      saveCategory: async (input, id) => {
        if (id) await updateCategoryApi(id, input);
        else await createCategoryApi(input);
        await load();
      },

      removeCategory: async (id) => {
        await deleteCategoryApi(id);
        await load();
      },

      categorizeBacklog: async () => {
        const result = await categorizeBacklogApi();
        await load();
        return result;
      },

      updateTransaction: async (id, input) => {
        await patchTransaction(id, input);
        await load();
      },

      // Quick inline re-category (Transactions table): patch just the category,
      // carrying the row's other fields through unchanged. `applyToMerchant`
      // optionally propagates to every transaction from the same merchant.
      setTransactionCategory: async (id, categoryId, applyToMerchant = false) => {
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;
        await patchTransaction(id, {
          merchant: txn.merchant,
          amountCents: txn.amountCents,
          categoryId,
          note: txn.note ?? null,
          excludeFromBudget: Boolean(txn.excludeFromBudget),
          applyToMerchant,
        });
        await load();
      },

      // Bulk categorize (Transactions multi-select): assign one category to many
      // rows in a single request, then refresh.
      bulkCategorize: async (ids, categoryId) => {
        const count = await bulkCategorizeApi(ids, categoryId);
        await load();
        return count;
      },

      deleteTransaction: async (id) => {
        await apiDeleteTransaction(id);
        await load();
      },

      updateProfile: async (input) => {
        const user = await apiUpdateProfile(input);
        set({ user });
      },

      saveGoal: async (input, id) => {
        if (id) await updateGoalApi(id, input);
        else await apiCreateGoal(input);
        await load();
      },

      removeGoal: async (id) => {
        await deleteGoalApi(id);
        await load();
      },

      sweepRoundups: async () => {
        const result = await sweepRoundupsApi();
        await load();
        return result;
      },

      adjustBudget: (id, deltaCents) => {
        set((prev) => ({
          webBudgets: {
            ...prev.webBudgets,
            [id]: Math.max(0, (prev.webBudgets[id] ?? 0) + deltaCents),
          },
        }));
        persistBudget(id);
      },

      setBudget: (id, cents) => {
        set((prev) => ({
          webBudgets: { ...prev.webBudgets, [id]: Math.max(0, Math.round(cents)) },
        }));
        persistBudget(id);
      },

      // Optimistic update + debounced persist of the monthly budget pool.
      setBudgetPool: (cents) => {
        const value = Math.max(0, Math.round(cents));
        set((prev) => ({ user: { ...prev.user, budgetPoolCents: value } }));
        if (poolTimer) clearTimeout(poolTimer);
        poolTimer = setTimeout(() => {
          void updateBudgetPoolApi(get().user.budgetPoolCents);
        }, 600);
      },

      finishFlow: () => set({ flowStep: "done" }),

      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Login failed.");
        await load();
        set({ flowStep: "done" });
      },

      signup: async (email, password) => {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok)
          throw new Error((await res.json().catch(() => ({}))).error ?? "Sign up failed.");
        await load();
        set({ flowStep: "income" });
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore network errors on logout
        }
        set({ flowStep: "login", mobileScreen: "home", webView: "overview", loaded: false });
      },

      refresh: () => load(),

      bootstrap: async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            await load();
            set({ flowStep: "done" });
            return;
          }
        } catch {
          // not signed in / API unreachable — fall through to the login gate
        }
        // Auth check resolved as "not signed in" — show the login gate.
        set({ flowStep: "login" });
      },
    };
  });
}

const StoreContext = createContext<AppStoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // One store instance per provider — the lazy initializer runs once, so it's
  // stable across renders and fresh per request on the server.
  const [store] = useState(createAppStore);

  // Kick off the one-time auth check on mount. Guarded so React strict mode's
  // double-invoke doesn't fire two /api/auth/me requests.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void store.getState().bootstrap();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** Subscribe to the store. Call with no selector to read the whole store
 *  (re-renders on any change), or pass a selector to subscribe to just a slice —
 *  wrap multi-field selectors in `useShallow` to avoid needless re-renders. */
export function useStore(): AppStore;
export function useStore<T>(selector: (state: AppStore) => T): T;
export function useStore<T>(selector?: (state: AppStore) => T) {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within a StoreProvider");
  return useZustandStore(store, selector as (state: AppStore) => T);
}

export { BUDGET_STEP };
export type { AppState, AppStore } from "./types";
