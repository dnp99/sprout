"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type AppData,
  type CategoryInput,
  type EditTransactionInput,
  type GoalInput,
  type ProfileInput,
  type RecurringInput,
  createCategoryApi,
  updateCategoryApi,
  createGoal as apiCreateGoal,
  createRecurring as apiCreateRecurring,
  deleteGoalApi,
  deleteRecurringApi,
  deleteTransaction as apiDeleteTransaction,
  updateGoalApi,
  updateRecurringApi,
  updateProfile as apiUpdateProfile,
  patchTransaction,
  fetchAppData,
  postTransaction,
} from "@/lib/api";
import { toRecurringInput } from "@/lib/recurring/input";
import type { SortDir, SortKey } from "@/lib/search";
import type {
  AddMode,
  BudgetSummary,
  Category,
  ConnectedAccount,
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

  // Loaded from /api/summary alongside categories + summary.
  goals: Goal[];
  recurring: RecurringItem[];
  accounts: ConnectedAccount[];

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
  currency: "USD",
  budgetCycle: "monthly",
};

const initialState = (): AppState => ({
  user: emptyUser,
  categories: [],
  transactions: [],
  summary: emptySummary,
  loaded: false,
  loadError: false,
  goals: [],
  recurring: [],
  accounts: [],
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
  webSortKey: "date",
  webSortDir: "desc",
  webBudgets: {},
  webEditTxnId: null,
  trendMonthKey: "",
  viewMonthKey: "",
  flowStep: "login",
  onbIncome: "",
  onbCats: { groceries: true, bills: true, transport: true },
  onbGoal: "em",
});

interface StoreValue extends AppState {
  set: (patch: Partial<AppState>) => void;
  goMobile: (screen: MobileScreen) => void;
  openCategory: (id: string) => void;
  openTransaction: (id: string) => void;
  pressKey: (key: string) => void;
  commitAdd: () => void;
  resetAdd: () => void;
  toggleRecurring: (id: string) => void;
  updateTransaction: (id: string, input: EditTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateProfile: (input: ProfileInput) => Promise<void>;
  saveGoal: (input: GoalInput, id?: string) => Promise<void>;
  removeGoal: (id: string) => Promise<void>;
  saveRecurring: (input: RecurringInput, id?: string) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  createCategory: (input: CategoryInput) => Promise<void>;
  adjustBudget: (id: string, deltaCents: number) => void;
  setBudget: (id: string, cents: number) => void;
  finishFlow: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const BUDGET_STEP = 2500; // $25

/** Merge fetched server data into state, seeding webBudgets from category
 *  budgets on the first load only (so later refetches don't wipe in-progress
 *  budget edits). */
function withData(prev: AppState, data: AppData): AppState {
  return {
    ...prev,
    user: data.user,
    categories: data.categories,
    transactions: data.transactions,
    summary: data.summary,
    goals: data.goals,
    recurring: data.recurring,
    accounts: data.accounts,
    loaded: true,
    loadError: false,
    selectedCategoryId: prev.selectedCategoryId || data.categories[0]?.id || "",
    selectedTxnId: prev.selectedTxnId || data.transactions[0]?.id || "",
    addCategoryId: data.categories.some((c) => c.id === prev.addCategoryId)
      ? prev.addCategoryId
      : (data.categories.find((c) => c.id !== "bills")?.id ?? prev.addCategoryId),
    webBudgets: prev.loaded
      ? prev.webBudgets
      : Object.fromEntries(data.categories.map((c) => [c.id, c.monthlyBudgetCents])),
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  // Always-current snapshot for use inside timers/callbacks without stale closures.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const set = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchAppData();
      setState((prev) => withData(prev, data));
    } catch {
      // Data fetch failed after auth — surface an error screen instead of
      // rendering stale/fake data.
      setState((prev) => ({ ...prev, loaded: false, loadError: true }));
    }
  }, []);

  const bootstrap = useCallback(async () => {
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
  }, [load, set]);

  useEffect(() => {
    // bootstrap() is async — setState only runs after the fetch resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void bootstrap();
  }, [bootstrap]);

  const goMobile = useCallback((screen: MobileScreen) => set({ mobileScreen: screen }), [set]);
  const openCategory = useCallback(
    (id: string) => set({ selectedCategoryId: id, mobileScreen: "catDetail" }),
    [set],
  );
  const openTransaction = useCallback(
    (id: string) => set({ selectedTxnId: id, mobileScreen: "txnDetail" }),
    [set],
  );
  const resetAdd = useCallback(
    () => set({ addAmountCents: 0, addMerchant: "", addRecurring: false, addMode: "expense" }),
    [set],
  );

  const pressKey = useCallback((key: string) => {
    setState((prev) => {
      if (key === "back") return { ...prev, addAmountCents: Math.floor(prev.addAmountCents / 10) };
      if (key === ".") return prev;
      const digit = Number(key);
      if (!Number.isInteger(digit)) return prev;
      return { ...prev, addAmountCents: Math.min(prev.addAmountCents * 10 + digit, 99_999_99) };
    });
  }, []);

  const commitAdd = useCallback(async () => {
    let magnitude = 0;
    let isIncome = false;
    let categoryId: string | null = null;
    let merchant = "";
    setState((prev) => {
      magnitude = prev.addAmountCents;
      isIncome = prev.addMode === "income";
      categoryId = isIncome ? null : prev.addCategoryId;
      merchant = prev.addMerchant.trim();
      return {
        ...prev,
        addAmountCents: 0,
        addMerchant: "",
        addRecurring: false,
        mobileScreen: "home",
        webAddOpen: false,
      };
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
  }, [load]);

  const toggleRecurring = useCallback(
    async (id: string) => {
      const item = state.recurring.find((r) => r.id === id);
      if (!item) return;
      await updateRecurringApi(id, toRecurringInput({ ...item, paused: !item.paused }));
      await load();
    },
    [state.recurring, load],
  );

  const saveRecurring = useCallback(
    async (input: RecurringInput, id?: string) => {
      if (id) await updateRecurringApi(id, input);
      else await apiCreateRecurring(input);
      await load();
    },
    [load],
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      await deleteRecurringApi(id);
      await load();
    },
    [load],
  );

  const createCategory = useCallback(
    async (input: CategoryInput) => {
      await createCategoryApi(input);
      await load();
    },
    [load],
  );

  const updateTransaction = useCallback(
    async (id: string, input: EditTransactionInput) => {
      await patchTransaction(id, input);
      await load();
    },
    [load],
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await apiDeleteTransaction(id);
      await load();
    },
    [load],
  );

  const updateProfile = useCallback(async (input: ProfileInput) => {
    const user = await apiUpdateProfile(input);
    setState((prev) => ({ ...prev, user }));
  }, []);

  const saveGoal = useCallback(
    async (input: GoalInput, id?: string) => {
      if (id) await updateGoalApi(id, input);
      else await apiCreateGoal(input);
      await load();
    },
    [load],
  );

  const removeGoal = useCallback(
    async (id: string) => {
      await deleteGoalApi(id);
      await load();
    },
    [load],
  );

  // Debounce DB writes per category so rapid stepper clicks / typing persist
  // once the user pauses, then refresh so the summary (total budget) updates.
  const budgetTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const persistBudget = useCallback(
    (id: string) => {
      const timers = budgetTimers.current;
      const existing = timers.get(id);
      if (existing) clearTimeout(existing);
      timers.set(
        id,
        setTimeout(() => {
          timers.delete(id);
          const cat = stateRef.current.categories.find((c) => c.id === id);
          const cents = stateRef.current.webBudgets[id];
          if (!cat || cents === undefined) return;
          void updateCategoryApi(id, {
            name: cat.name,
            emoji: cat.emoji,
            color: cat.color,
            monthlyBudgetCents: cents,
          }).then(() => load());
        }, 600),
      );
    },
    [load],
  );

  const adjustBudget = useCallback(
    (id: string, deltaCents: number) => {
      setState((prev) => ({
        ...prev,
        webBudgets: {
          ...prev.webBudgets,
          [id]: Math.max(0, (prev.webBudgets[id] ?? 0) + deltaCents),
        },
      }));
      persistBudget(id);
    },
    [persistBudget],
  );

  const setBudget = useCallback(
    (id: string, cents: number) => {
      setState((prev) => ({
        ...prev,
        webBudgets: { ...prev.webBudgets, [id]: Math.max(0, Math.round(cents)) },
      }));
      persistBudget(id);
    },
    [persistBudget],
  );

  const finishFlow = useCallback(() => set({ flowStep: "done" }), [set]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Login failed.");
      await load();
      set({ flowStep: "done" });
    },
    [load, set],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Sign up failed.");
      await load();
      set({ flowStep: "income" });
    },
    [load, set],
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors on logout
    }
    set({ flowStep: "login", mobileScreen: "home", webView: "overview", loaded: false });
  }, [set]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      set,
      goMobile,
      openCategory,
      openTransaction,
      pressKey,
      commitAdd,
      resetAdd,
      toggleRecurring,
      updateTransaction,
      deleteTransaction,
      updateProfile,
      saveGoal,
      removeGoal,
      saveRecurring,
      removeRecurring,
      createCategory,
      adjustBudget,
      setBudget,
      finishFlow,
      login,
      signup,
      logout,
      refresh: load,
    }),
    [
      state,
      set,
      goMobile,
      openCategory,
      openTransaction,
      pressKey,
      commitAdd,
      resetAdd,
      toggleRecurring,
      updateTransaction,
      deleteTransaction,
      updateProfile,
      saveGoal,
      removeGoal,
      saveRecurring,
      removeRecurring,
      createCategory,
      adjustBudget,
      setBudget,
      finishFlow,
      login,
      signup,
      logout,
      load,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within a StoreProvider");
  return store;
}

export { BUDGET_STEP };
