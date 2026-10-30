"use client";

import { persistEditedHighlight } from "@/lib/edited-highlight";

import { createStore, type StoreApi } from "zustand/vanilla";
import {
  categorizeBacklogApi,
  sweepRoundupsApi,
  createCategoryApi,
  createBusinessApi,
  createIncomeSourceApi,
  deleteBusinessApi,
  updateIncomeSourceApi,
  updateBusinessApi,
  updateCategoryApi,
  deleteCategoryApi,
  deleteIncomeSourceApi,
  updateBudgetPoolApi,
  createGoal as apiCreateGoal,
  createRecurring as apiCreateRecurring,
  deleteGoalApi,
  deleteRecurringApi,
  deleteTransaction as apiDeleteTransaction,
  bulkCategorizeApi,
  bulkSetIncomeSourceApi,
  bulkExcludeApi,
  bulkIncludeApi,
  bulkDeleteApi,
  updateGoalApi,
  updateRecurringApi,
  markRecurringPaidApi,
  updateProfile as apiUpdateProfile,
  patchTransaction,
  fetchWithTimeout,
  postTransaction,
} from "@/lib/api";
import { initAnalytics, identifyUser, trackEvent, resetAnalytics } from "@/lib/analytics";
import { toRecurringInput } from "@/lib/recurring/input";
import { reconcileTransactionPatch } from "@/lib/transactions/reconcile";
import {
  applyTheme,
  resolveTheme,
  persistPref,
  applyVisualTheme,
  persistVisualTheme,
} from "@/lib/appearance";
import { createPersonalLoader } from "./personal-loader";
import { groupSlice } from "./groups";
import { initialState } from "./initial";
import type { AppState, AppStore } from "./types";

type AppStoreApi = StoreApi<AppStore>;

/** Build a fresh store instance. Per-provider (one per request on the server) so
 *  there's no cross-request state bleed. `set` merges shallowly (Zustand default),
 *  and `get()` gives the always-current snapshot inside async thunks/timers —
 *  which is why no `stateRef` mirror is needed anymore. `seed` lets the localized
 *  layout inject the request-resolved locale so SSR + hydration agree (plan 013). */
export function createAppStore(seed?: Partial<AppState>): AppStoreApi {
  return createStore<AppStore>()((set, get) => {
    // Debounce DB writes per category so rapid stepper clicks / typing persist
    // once the user pauses, then refresh so the summary (total budget) updates.
    const budgetTimers = new Map<string, ReturnType<typeof setTimeout>>();
    let poolTimer: ReturnType<typeof setTimeout> | null = null;

    const personal = createPersonalLoader(set, get);
    const load = personal.load;
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
            budgetGroup: cat.budgetGroup ?? null,
          }).then(() => load());
        }, 600),
      );
    };

    return {
      ...initialState(),
      ...groupSlice(set, get),
      ...seed,

      set: (patch) => set(patch),
      setEditedHighlight: (enabled) => {
        set({ editedHighlight: enabled });
        persistEditedHighlight(enabled);
      },
      setThemePref: (pref) => {
        const resolved = resolveTheme(pref);
        set({ themePref: pref, theme: resolved });
        applyTheme(resolved);
        persistPref(pref);
      },
      setVisualTheme: (visualTheme) => {
        set({ visualTheme });
        applyVisualTheme(visualTheme);
        persistVisualTheme(visualTheme);
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
          addIncomeSourceId: "",
          addBusinessId: "",
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
        const incomeSourceId = isIncome ? prev.addIncomeSourceId || null : null;
        const wasFirst = prev.transactions.length === 0;
        set({ addSubmitting: true, addSaveError: null });

        try {
          const transaction = await postTransaction({
            merchant,
            amountCents: isIncome || prev.addMode === "reimbursement" ? magnitude : -magnitude,
            categoryId,
            incomeSourceId,
            businessId: prev.addBusinessId || null,
            kind: prev.addMode,
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
            addIncomeSourceId: "",
            addBusinessId: "",
            addRecurring: false,
            addSubmitting: false,
            // Return to whatever screen opened the Add flow, not always Home.
            mobileScreen: prev.addReturnTo,
            webAddOpen: false,
          }));
          // Refresh the summary/categories and reconcile with the full server
          // list without delaying the newly created row in the UI.
          void load();
          // Funnel step. `mode` (expense/income/reimbursement) + `first` are the only props —
          // never the amount or merchant. See docs/analytics.md.
          trackEvent("transaction_added", {
            mode: prev.addMode,
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

      saveIncomeSource: async (input, id) => {
        if (id) await updateIncomeSourceApi(id, input);
        else await createIncomeSourceApi(input);
        await load();
      },

      removeIncomeSource: async (id) => {
        await deleteIncomeSourceApi(id);
        await load();
      },

      saveBusiness: async (input, id) => {
        if (id) await updateBusinessApi(id, input);
        else await createBusinessApi(input);
        await load();
      },

      removeBusiness: async (id) => {
        await deleteBusinessApi(id);
        await load();
      },

      categorizeBacklog: async () => {
        const result = await categorizeBacklogApi();
        await load();
        return result;
      },

      updateTransaction: async (id, input) => {
        const updated = await patchTransaction(id, input);
        set((prev) => ({
          transactions: reconcileTransactionPatch(
            prev.transactions,
            updated,
            input,
            prev.categories,
          ),
        }));
        // Summary and the full transaction list still reconcile from the
        // server, but the edit form no longer waits on the streamed payload.
        void load();
      },

      // Quick inline re-category (Transactions table): patch just the category,
      // carrying the row's other fields through unchanged. `applyToMerchant`
      // optionally propagates to every transaction from the same merchant.
      setTransactionCategory: async (id, categoryId, applyToMerchant = false) => {
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;
        const input = {
          merchant: txn.merchant,
          amountCents: txn.amountCents,
          categoryId,
          incomeSourceId: txn.incomeSourceId ?? null,
          kind: txn.kind ?? (txn.isIncome ? "income" : "expense"),
          note: txn.note ?? null,
          excludeFromBudget: Boolean(txn.excludeFromBudget),
          applyToMerchant,
        };
        const updated = await patchTransaction(id, input);
        set((prev) => ({
          transactions: reconcileTransactionPatch(
            prev.transactions,
            updated,
            input,
            prev.categories,
          ),
        }));
        void load();
      },

      // Bulk categorize (Transactions multi-select): assign one category to many
      // rows in a single request, then refresh.
      bulkCategorize: async (ids, categoryId) => {
        const count = await bulkCategorizeApi(ids, categoryId);
        await load();
        return count;
      },

      bulkSetIncomeSource: async (ids, incomeSourceId) => {
        const count = await bulkSetIncomeSourceApi(ids, incomeSourceId);
        await load();
        return count;
      },

      bulkExclude: async (ids) => {
        const count = await bulkExcludeApi(ids);
        await load();
        return count;
      },

      bulkInclude: async (ids) => {
        const count = await bulkIncludeApi(ids);
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
        const result = await load();
        if (result === "cancelled" || result === "signed-out") return;
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
        const result = await load();
        if (result === "cancelled" || result === "signed-out") return;
        // Top of the onboarding funnel — see docs/analytics.md.
        identifyUser(get().user.id);
        trackEvent("signup_completed");
        // Land the user straight in the app; post-signup setup (budget, goal)
        // now happens via Home activation, not a gated wizard — see plans/007.
        set({ flowStep: "done" });
      },

      clearSessionState: () => {
        personal.cancel();
        for (const timer of budgetTimers.values()) clearTimeout(timer);
        budgetTimers.clear();
        if (poolTimer) clearTimeout(poolTimer);
        poolTimer = null;
        get().clearGroup();
        const { visualTheme, themePref, theme, editedHighlight, localePref, locale } = get();
        resetAnalytics();
        set({
          ...initialState(),
          visualTheme,
          themePref,
          theme,
          editedHighlight,
          localePref,
          locale,
          flowStep: "login",
        });
      },
      logout: async () => {
        get().clearSessionState();
        try {
          await fetch("/api/auth/logout", { method: "POST", cache: "no-store" });
        } catch {
          /* The local session remains locked when the network is unavailable. */
        }
      },

      refresh: async () => {
        await load();
      },

      bootstrap: async () => {
        void initAnalytics();
        try {
          // Time-boxed: a hanging /api/auth/me (or the summary load below) must
          // never trap the app on the boot splash. On timeout it rejects and we
          // fall through to the login gate, keeping public pages reachable.
          const res = await fetchWithTimeout("/api/auth/me");
          if (res.ok) {
            const result = await load();
            if (result === "cancelled" || result === "signed-out") return;
            identifyUser(get().user.id);
            set({ flowStep: "done" });
            return;
          }
        } catch {
          // not signed in / API unreachable / timed out — fall through
        }
        // Auth check resolved as "not signed in" — show the login gate.
        get().clearSessionState();
      },
    };
  });
}
