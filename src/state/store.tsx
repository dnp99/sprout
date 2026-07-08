"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useStore as useZustandStore } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";
import {
  type SummaryData,
  type BacklogResult,
  type CategoryInput,
  type EditTransactionInput,
  type GoalInput,
  type ProfileInput,
  type RecurringInput,
  categorizeBacklogApi,
  type RoundupSweepResult,
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
import type { SortDir, SortKey } from "@/lib/search";
import type {
  AddMode,
  BudgetSummary,
  Category,
  FlowStep,
  Frequency,
  Goal,
  MobileScreen,
  RecurringItem,
  Transaction,
  TxnFilter,
  User,
  WebView,
} from "@/lib/types";

interface AppState {
  // Server data (persisted in Neon for the single test user)
  user: User;
  categories: Category[];
  transactions: Transaction[];
  summary: BudgetSummary;
  loaded: boolean;
  /** Set when the data fetch failed after auth — the app shows an error screen. */
  loadError: boolean;
  /** True while the (large) transactions payload is still loading after the
   *  summary has painted the shell — transaction-derived widgets show skeletons. */
  transactionsLoading: boolean;

  // Loaded from /api/summary alongside categories + summary.
  goals: Goal[];
  recurring: RecurringItem[];

  // Mobile navigation
  mobileScreen: MobileScreen;
  selectedCategoryId: string;
  selectedTxnId: string;

  // Add flow (shared by mobile Add screen + web Add modal)
  addMode: AddMode;
  addAmountCents: number;
  addMerchant: string;
  addCategoryId: string;
  addRecurring: boolean;
  addFrequency: Frequency;

  // Mobile search
  searchQuery: string;
  searchType: TxnFilter;
  searchCategoryId: string;

  /** Category-id filter shared by the web + mobile Transactions views, or "all".
   *  Set when you tap a category on the dashboard to see just its transactions. */
  txnCategory: string;

  // Web
  webView: WebView;
  webAddOpen: boolean;
  webUserMenuOpen: boolean;
  webTxnQuery: string;
  webTxnType: TxnFilter;
  webSortKey: SortKey;
  webSortDir: SortDir;
  webBudgets: Record<string, number>;
  // Transaction id being edited in the web edit modal, or null when closed.
  webEditTxnId: string | null;
  // Selected month on the Trends view ("2026-06"); "" = use the default month.
  // Shared so the header period pill reflects the chart selection.
  trendMonthKey: string;
  // Selected month for month-scoped views (Transactions, Categories); "" = the
  // latest month with data.
  viewMonthKey: string;

  // Auth / onboarding (deferred — starts "done" so the app is visible)
  flowStep: FlowStep;
  onbIncome: string;
  onbCats: Record<string, boolean>;
  onbGoal: string;
}

/** Actions + async thunks. Colocated with state in the Zustand store, so adding
 *  one is a single edit (no separate context value / deps array to keep in sync). */
interface AppActions {
  set: (patch: Partial<AppState>) => void;
  goMobile: (screen: MobileScreen) => void;
  openCategory: (id: string) => void;
  openTransaction: (id: string) => void;
  pressKey: (key: string) => void;
  commitAdd: () => void;
  resetAdd: () => void;
  toggleRecurring: (id: string) => void;
  updateTransaction: (id: string, input: EditTransactionInput) => Promise<void>;
  setTransactionCategory: (
    id: string,
    categoryId: string | null,
    applyToMerchant?: boolean,
  ) => Promise<void>;
  bulkCategorize: (ids: string[], categoryId: string | null) => Promise<number>;
  deleteTransaction: (id: string) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  saveGoal: (input: GoalInput, id?: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  sweepRoundups: () => Promise<RoundupSweepResult>;
  saveRecurring: (input: RecurringInput, id?: string) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  saveCategory: (input: CategoryInput, id?: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  categorizeBacklog: () => Promise<BacklogResult>;
  adjustBudget: (id: string, deltaCents: number) => void;
  setBudget: (id: string, cents: number) => void;
  setBudgetPool: (cents: number) => void;
  finishFlow: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  /** One-time auth check on mount; internal (called by StoreProvider). */
  bootstrap: () => Promise<void>;
}

export type AppStore = AppState & AppActions;
type AppStoreApi = StoreApi<AppStore>;

const emptySummary: BudgetSummary = {
  safeToSpendCents: 0,
  spentCents: 0,
  budgetCents: 0,
  incomeCents: 0,
  savedCents: 0,
  daysLeft: 0,
  monthLabel: "",
};

// Placeholder before the real user loads; never rendered (the app is gated on
// the auth flow until data arrives).
const emptyUser: User = {
  id: "",
  name: "",
  greetingName: "",
  email: "",
  currency: "CAD",
  budgetCycle: "monthly",
  budgetPoolCents: 400000,
};

const initialState = (): AppState => ({
  user: emptyUser,
  categories: [],
  transactions: [],
  summary: emptySummary,
  loaded: false,
  loadError: false,
  transactionsLoading: false,
  goals: [],
  recurring: [],
  mobileScreen: "home",
  selectedCategoryId: "",
  selectedTxnId: "",
  addMode: "expense",
  addAmountCents: 0,
  addMerchant: "",
  addCategoryId: "groceries",
  addRecurring: false,
  addFrequency: "Monthly",
  searchQuery: "",
  searchType: "all",
  searchCategoryId: "all",
  webView: "overview",
  webAddOpen: false,
  webUserMenuOpen: false,
  webTxnQuery: "",
  webTxnType: "all",
  txnCategory: "all",
  webSortKey: "date",
  webSortDir: "desc",
  webBudgets: {},
  webEditTxnId: null,
  trendMonthKey: "",
  viewMonthKey: "",
  flowStep: "booting",
  onbIncome: "",
  onbCats: { groceries: true, bills: true, transport: true },
  onbGoal: "em",
});

const BUDGET_STEP = 2500; // $25

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
