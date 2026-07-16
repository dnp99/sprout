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
  bulkDeleteApi,
  updateGoalApi,
  updateRecurringApi,
  markRecurringPaidApi,
  updateProfile as apiUpdateProfile,
  patchTransaction,
  fetchSummary,
  fetchTransactions,
  fetchWithTimeout,
  postTransaction,
} from "@/lib/api";
import { initAnalytics, identifyUser, trackEvent, resetAnalytics } from "@/lib/analytics";
import type { AppLocale, LocalePref } from "@/lib/locale";
import { toRecurringInput } from "@/lib/recurring/input";
import type { Transaction } from "@/lib/types";
import { initialState } from "./initial";
import type { AppState, AppStore } from "./types";

type AppStoreApi = StoreApi<AppStore>;

type ThemePref = "system" | "light" | "dark";

/** Resolve a preference to the concrete theme — "system" follows the OS. */
function resolveTheme(pref: ThemePref): "light" | "dark" {
  if (pref === "light" || pref === "dark") return pref;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Reflect the resolved theme onto <html>. No-ops on the server. */
function applyTheme(theme: "light" | "dark") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Persist the preference. "system" is the default, stored by removing the key
 *  so the app keeps following the OS. No-ops / swallows errors on the server or
 *  in private mode (theme still applies for the session). */
function persistPref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem("sprout-theme");
    else localStorage.setItem("sprout-theme", pref);
  } catch {
    // localStorage unavailable — preference isn't remembered, but still applies.
  }
}

/** Read the persisted preference, defaulting to "system". Server-safe. */
function readPref(): ThemePref {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem("sprout-theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // ignore — fall through to the default
  }
  return "system";
}

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
 *  which is why no `stateRef` mirror is needed anymore. `seed` lets the localized
 *  layout inject the request-resolved locale so SSR + hydration agree (plan 013). */
function createAppStore(seed?: Partial<AppState>): AppStoreApi {
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
      ...seed,

      set: (patch) => set(patch),
      setThemePref: (pref) => {
        const resolved = resolveTheme(pref);
        set({ themePref: pref, theme: resolved });
        applyTheme(resolved);
        persistPref(pref);
      },
      goMobile: (screen) =>
        set((prev) =>
          // Remember where the Add flow was launched from so it returns there.
          screen === "add" && prev.mobileScreen !== "add"
            ? { mobileScreen: screen, addReturnTo: prev.mobileScreen }
            : { mobileScreen: screen },
        ),
      openCategory: (id) => set({ selectedCategoryId: id, mobileScreen: "catDetail" }),
      openTransaction: (id) => set({ selectedTxnId: id, mobileScreen: "txnDetail" }),
      resetAdd: () =>
        set({
          addAmountCents: 0,
          addMerchant: "",
          addOccurredAt: "",
          addRecurring: false,
          addMode: "expense",
          addSubmitting: false,
          addSaveError: null,
        }),

      pressKey: (key) =>
        set((prev) => {
          if (key === "back") return { addAmountCents: Math.floor(prev.addAmountCents / 10) };
          // "00" appends two zeros in one tap (round amounts like $50.00).
          if (key === "00")
            return { addAmountCents: Math.min(prev.addAmountCents * 100, 99_999_99) };
          // Returning the same state is a true no-op in Zustand (Object.is skips
          // the notify), matching the previous reducer's `return prev`.
          if (key === ".") return prev;
          const digit = Number(key);
          if (!Number.isInteger(digit)) return prev;
          return { addAmountCents: Math.min(prev.addAmountCents * 10 + digit, 99_999_99) };
        }),

      commitAdd: async () => {
        const prev = get();
        if (prev.addSubmitting) return;
        const magnitude = prev.addAmountCents;
        const merchant = prev.addMerchant.trim();
        // A merchant/source name and a positive amount are required. Ignore an
        // invalid submit so the sheet/modal stays open (the UI also disables the
        // submit button, so this is a belt-and-suspenders guard).
        if (magnitude <= 0 || !merchant) return;

        const isIncome = prev.addMode === "income";
        const categoryId = isIncome ? null : prev.addCategoryId;
        const wasFirst = prev.transactions.length === 0;
        set({ addSubmitting: true, addSaveError: null });

        try {
          const transaction = await postTransaction({
            merchant,
            amountCents: isIncome ? magnitude : -magnitude,
            categoryId,
            occurredAt: prev.addOccurredAt || undefined,
          });
          // The POST already returns the canonical DTO, so surface it now
          // instead of making the user wait for the background list refresh.
          set((current) => ({
            transactions: [
              transaction,
              ...current.transactions.filter((entry) => entry.id !== transaction.id),
            ],
            selectedTxnId: current.selectedTxnId || transaction.id,
            addAmountCents: 0,
            addMerchant: "",
            addOccurredAt: "",
            addRecurring: false,
            addSubmitting: false,
            // Return to whatever screen opened the Add flow, not always Home.
            mobileScreen: prev.addReturnTo,
            webAddOpen: false,
          }));
          // Refresh the summary/categories and reconcile with the full server
          // list without delaying the newly created row in the UI.
          void load();
          // Funnel step. `mode` (expense/income) + `first` are the only props —
          // never the amount or merchant. See docs/analytics.md.
          trackEvent("transaction_added", {
            mode: isIncome ? "income" : "expense",
            first: String(wasFirst),
          });
        } catch {
          // Keep the form open with the captured values, so a transient failure
          // is visible and retryable instead of silently discarding the entry.
          set({ addSubmitting: false, addSaveError: "Couldn't save. Try again." });
        }
      },

      toggleRecurring: async (id) => {
        const item = get().recurring.find((r) => r.id === id);
        if (!item) return;
        await updateRecurringApi(id, toRecurringInput({ ...item, paused: !item.paused }));
        await load();
      },

      markRecurringPaid: async (id, dueDate) => {
        await markRecurringPaidApi(id, dueDate);
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

      bulkDelete: async (ids) => {
        const count = await bulkDeleteApi(ids);
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

      setBudget: (id, cents) => {
        set((prev) => ({
          webBudgets: { ...prev.webBudgets, [id]: Math.max(0, Math.round(cents)) },
        }));
        persistBudget(id);
      },

      // Optimistic update + debounced persist of the monthly budget pool.
      setBudgetPool: (cents) => {
        const value = Math.max(0, Math.round(cents));
        // Funnel step: fire once when the budget goes from unset (0) to a real
        // value. No amount is sent — just that a budget now exists.
        if (get().user.budgetPoolCents === 0 && value > 0) trackEvent("budget_set");
        set((prev) => ({ user: { ...prev.user, budgetPoolCents: value } }));
        if (poolTimer) clearTimeout(poolTimer);
        poolTimer = setTimeout(() => {
          // Refetch after persisting so the server-derived summary (safe-to-spend,
          // and the Home checklist/hero "has budget" signal) reflects the new
          // total — mirrors persistBudget for per-category edits.
          void updateBudgetPoolApi(get().user.budgetPoolCents).then(() => load());
        }, 600);
      },

      login: async (email, password) => {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Login failed.");
        await load();
        identifyUser(get().user.id);
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
        // Top of the onboarding funnel — see docs/analytics.md.
        identifyUser(get().user.id);
        trackEvent("signup_completed");
        // Land the user straight in the app; post-signup setup (budget, goal)
        // now happens via Home activation, not a gated wizard — see plans/007.
        set({ flowStep: "done" });
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // ignore network errors on logout
        }
        resetAnalytics();
        set({ flowStep: "login", mobileScreen: "home", webView: "overview", loaded: false });
      },

      refresh: () => load(),

      bootstrap: async () => {
        void initAnalytics();
        try {
          // Time-boxed: a hanging /api/auth/me (or the summary load below) must
          // never trap the app on the boot splash. On timeout it rejects and we
          // fall through to the login gate, keeping public pages reachable.
          const res = await fetchWithTimeout("/api/auth/me");
          if (res.ok) {
            await load();
            identifyUser(get().user.id);
            set({ flowStep: "done" });
            return;
          }
        } catch {
          // not signed in / API unreachable / timed out — fall through
        }
        // Auth check resolved as "not signed in" — show the login gate.
        set({ flowStep: "login" });
      },
    };
  });
}

const StoreContext = createContext<AppStoreApi | null>(null);

export function StoreProvider({
  children,
  initialLocalePref = "system",
  initialLocale = "en-CA",
}: {
  children: React.ReactNode;
  /** The cookie preference + request-resolved locale from the localized layout
   *  (plan 013), so the store hydrates in the language the server rendered. */
  initialLocalePref?: LocalePref;
  initialLocale?: AppLocale;
}) {
  // One store instance per provider — the lazy initializer runs once, so it's
  // stable across renders and fresh per request on the server.
  const [store] = useState(() =>
    createAppStore({ localePref: initialLocalePref, locale: initialLocale }),
  );

  // Kick off the one-time auth check on mount. Guarded so React strict mode's
  // double-invoke doesn't fire two /api/auth/me requests.
  const booted = useRef(false);
  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void store.getState().bootstrap();
  }, [store]);

  // Reconcile the store's theme with the persisted preference the no-FOUC script
  // already applied to <html>, and — while the preference is "system" — keep
  // following the OS live as it changes. Cleaned up on unmount (strict-mode safe).
  useEffect(() => {
    const pref = readPref();
    store.getState().set({ themePref: pref, theme: resolveTheme(pref) });
    applyTheme(resolveTheme(pref));
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (store.getState().themePref !== "system") return;
      const next: "light" | "dark" = mql.matches ? "dark" : "light";
      store.getState().set({ theme: next });
      applyTheme(next);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
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

export type { AppState, AppStore } from "./types";
