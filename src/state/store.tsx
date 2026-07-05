"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { type AppData, fetchAppData, postTransaction } from "@/lib/api";
import {
  mockCategories,
  mockGoals,
  mockRecurring,
  mockSummary,
  mockTransactions,
  mockUser,
} from "@/lib/mock";
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

  // Local-only data (no tables yet — still mock)
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
  // Selected month on the Trends view ("2026-06"); "" = use the default month.
  // Shared so the header period pill reflects the chart selection.
  trendMonthKey: string;

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

const initialState = (): AppState => ({
  user: mockUser,
  categories: [],
  transactions: [],
  summary: emptySummary,
  loaded: false,
  goals: mockGoals,
  recurring: mockRecurring,
  accounts: [],
  mobileScreen: "home",
  selectedCategoryId: "",
  selectedTxnId: "",
  addMode: "expense",
  addAmountCents: 0,
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
  trendMonthKey: "",
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
  adjustBudget: (id: string, deltaCents: number) => void;
  finishFlow: () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const BUDGET_STEP = 2500; // $25

/** Merge fetched (or mock-fallback) server data into state, seeding webBudgets
 *  from category budgets on the first load only (so later refetches don't wipe
 *  in-progress budget edits). */
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

  const set = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchAppData();
      setState((prev) => withData(prev, data));
    } catch {
      // No DB reachable (e.g. env not set) — fall back to the mock dataset so
      // the app still renders.
      setState((prev) =>
        withData(prev, {
          user: mockUser,
          categories: mockCategories,
          transactions: mockTransactions,
          summary: mockSummary,
          goals: mockGoals,
          recurring: mockRecurring,
          accounts: [],
        }),
      );
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
    () => set({ addAmountCents: 0, addRecurring: false, addMode: "expense" }),
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
    setState((prev) => {
      magnitude = prev.addAmountCents;
      isIncome = prev.addMode === "income";
      categoryId = isIncome ? null : prev.addCategoryId;
      return {
        ...prev,
        addAmountCents: 0,
        addRecurring: false,
        mobileScreen: "home",
        webAddOpen: false,
      };
    });

    if (magnitude <= 0) return;
    try {
      await postTransaction({
        merchant: isIncome ? "Income" : "Expense",
        amountCents: isIncome ? magnitude : -magnitude,
        categoryId,
      });
      await load();
    } catch {
      // Best-effort: ignore write failures in the mock/no-DB case.
    }
  }, [load]);

  const toggleRecurring = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recurring: prev.recurring.map((r) => (r.id === id ? { ...r, paused: !r.paused } : r)),
    }));
  }, []);

  const adjustBudget = useCallback((id: string, deltaCents: number) => {
    setState((prev) => ({
      ...prev,
      webBudgets: {
        ...prev.webBudgets,
        [id]: Math.max(0, (prev.webBudgets[id] ?? 0) + deltaCents),
      },
    }));
  }, []);

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
      adjustBudget,
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
      adjustBudget,
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
