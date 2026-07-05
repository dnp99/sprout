"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { mockCategories, mockSummary, mockTransactions, mockUser } from "@/lib/mock";
import type { BudgetSummary, Category, TabKey, Transaction, User } from "@/lib/types";

/**
 * Client-side app store.
 *
 * This pass runs entirely on local state seeded from the mock dataset, so the
 * app works before Neon is connected. Interactions (tab navigation, adding an
 * expense) mutate this store and the Home screen re-renders live. Swapping to
 * the API later means hydrating this state from `/api/summary` +
 * `/api/transactions` and POSTing on add — the shapes already match.
 */

export interface NewExpenseInput {
  merchant: string;
  amountCents: number; // positive magnitude; stored as a negative expense
  categoryId: string;
}

/** The tabs that map to a full screen (the "+" opens a sheet, not a screen). */
export type ScreenTab = Exclude<TabKey, "add">;

interface StoreValue {
  user: User;
  categories: Category[];
  transactions: Transaction[];
  summary: BudgetSummary;
  activeTab: ScreenTab;
  setActiveTab: (tab: ScreenTab) => void;
  addExpense: (input: NewExpenseInput) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let idCounter = 0;
const nextId = () => `t_local_${++idCounter}`;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [summary, setSummary] = useState<BudgetSummary>(mockSummary);
  const [activeTab, setActiveTab] = useState<ScreenTab>("home");

  const addExpense = useCallback((input: NewExpenseInput) => {
    const magnitude = Math.abs(input.amountCents);
    const category = mockCategories.find((c) => c.id === input.categoryId);

    const transaction: Transaction = {
      id: nextId(),
      merchant: input.merchant,
      emoji: category?.emoji ?? "🧾",
      categoryId: input.categoryId,
      categoryName: category?.name ?? "Uncategorized",
      amountCents: -magnitude,
      method: "card",
      status: "posted",
      dateLabel: "Today",
      occurredAt: new Date().toISOString(),
    };

    setTransactions((prev) => [transaction, ...prev]);
    setCategories((prev) =>
      prev.map((c) =>
        c.id === input.categoryId ? { ...c, spentCents: c.spentCents + magnitude } : c,
      ),
    );
    setSummary((prev) => ({
      ...prev,
      spentCents: prev.spentCents + magnitude,
      safeToSpendCents: Math.max(0, prev.safeToSpendCents - magnitude),
    }));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      user: mockUser,
      categories,
      transactions,
      summary,
      activeTab,
      setActiveTab,
      addExpense,
    }),
    [categories, transactions, summary, activeTab, addExpense],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within a StoreProvider");
  return store;
}
