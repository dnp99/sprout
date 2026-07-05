"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAppData, postTransaction } from "@/lib/api";
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
  logout: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const BUDGET_STEP = 2500; // $25

/** Merge fetched (or mock-fallback) server data into state, seeding webBudgets
 *  from category budgets on the first load only (so later refetches don't wipe
 *  in-progress budget edits). */
function withData(
  prev: AppState,
  data: { user: User; categories: Category[]; transactions: Transaction[]; summary: BudgetSummary },
): AppState {
  return {
    ...prev,
    user: data.user,
    categories: data.categories,
    transactions: data.transactions,
    summary: data.summary,
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
        }),
      );
    }
  }, []);

  useEffect(() => {
    // load() is async — setState only runs after the fetch resolves — so this
    // is not a synchronous setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

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
  const logout = useCallback(
    () => set({ flowStep: "login", mobileScreen: "home", webView: "overview" }),
    [set],
  );

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
      logout,
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
      logout,
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
