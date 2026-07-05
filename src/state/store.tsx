"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
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
  WebView,
} from "@/lib/types";

interface AppState {
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  recurring: RecurringItem[];
  summary: BudgetSummary;

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

  // Auth / onboarding
  flowStep: FlowStep;
  onbIncome: string;
  onbCats: Record<string, boolean>;
  onbGoal: string;
}

const initialState = (): AppState => ({
  categories: mockCategories,
  transactions: mockTransactions,
  goals: mockGoals,
  recurring: mockRecurring,
  summary: mockSummary,
  mobileScreen: "home",
  selectedCategoryId: "groceries",
  selectedTxnId: "t_wf",
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
  webBudgets: Object.fromEntries(mockCategories.map((c) => [c.id, c.monthlyBudgetCents])),
  flowStep: "signup",
  onbIncome: "",
  onbCats: { groceries: true, bills: true, transport: true },
  onbGoal: "em",
});

interface StoreValue extends AppState {
  user: typeof mockUser;
  set: (patch: Partial<AppState>) => void;
  // Navigation
  goMobile: (screen: MobileScreen) => void;
  openCategory: (id: string) => void;
  openTransaction: (id: string) => void;
  // Add flow
  pressKey: (key: string) => void;
  commitAdd: () => void;
  resetAdd: () => void;
  // Interactions
  toggleRecurring: (id: string) => void;
  adjustBudget: (id: string, deltaCents: number) => void;
  // Auth
  finishFlow: () => void;
  logout: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const BUDGET_STEP = 2500; // $25

let localTxnCounter = 0;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);

  const set = useCallback((patch: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

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

  const commitAdd = useCallback(() => {
    setState((prev) => {
      if (prev.addAmountCents <= 0) return { ...prev, mobileScreen: "home", webAddOpen: false };
      const isIncome = prev.addMode === "income";
      const category = prev.categories.find((c) => c.id === prev.addCategoryId);
      const magnitude = prev.addAmountCents;
      const transaction: Transaction = {
        id: `t_local_${++localTxnCounter}`,
        merchant: isIncome ? "Income" : (category?.name ?? "Expense"),
        emoji: isIncome ? "💰" : (category?.emoji ?? "🧾"),
        categoryId: isIncome ? null : prev.addCategoryId,
        categoryName: isIncome ? "Income" : (category?.name ?? "Uncategorized"),
        amountCents: isIncome ? magnitude : -magnitude,
        note: null,
        method: "card",
        status: "posted",
        dateLabel: "Today",
        timeLabel: "Today",
        occurredAt: "",
        isIncome,
      };
      const categories = isIncome
        ? prev.categories
        : prev.categories.map((c) =>
            c.id === prev.addCategoryId ? { ...c, spentCents: c.spentCents + magnitude } : c,
          );
      const summary: BudgetSummary = isIncome
        ? { ...prev.summary, incomeCents: prev.summary.incomeCents + magnitude }
        : {
            ...prev.summary,
            spentCents: prev.summary.spentCents + magnitude,
            safeToSpendCents: Math.max(0, prev.summary.safeToSpendCents - magnitude),
          };
      return {
        ...prev,
        transactions: [transaction, ...prev.transactions],
        categories,
        summary,
        addAmountCents: 0,
        addRecurring: false,
        mobileScreen: "home",
        webAddOpen: false,
      };
    });
  }, []);

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
    () => set({ flowStep: "signup", mobileScreen: "home", webView: "overview" }),
    [set],
  );

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      user: mockUser,
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

/** The budget step used by the web category steppers. */
export { BUDGET_STEP };
