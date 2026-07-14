import type { BudgetSummary, User } from "@/lib/types";
import type { AppState } from "./types";

const emptySummary: BudgetSummary = {
  safeToSpendCents: 0,
  spentCents: 0,
  budgetCents: 0,
  allocatedCents: 0,
  unallocatedCents: 0,
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
  budgetPoolCents: 0,
};

/** Fresh state for a new store instance. */
export const initialState = (): AppState => ({
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
  addReturnTo: "home",
  selectedCategoryId: "",
  selectedTxnId: "",
  addMode: "expense",
  addAmountCents: 0,
  addMerchant: "",
  addOccurredAt: "",
  addCategoryId: "groceries",
  addRecurring: false,
  addFrequency: "Monthly",
  addSubmitting: false,
  addSaveError: null,
  searchQuery: "",
  searchType: "all",
  searchCategoryId: "all",
  webView: "overview",
  webAddOpen: false,
  webEditBudgetOpen: false,
  webUserMenuOpen: false,
  webTxnQuery: "",
  webTxnType: "all",
  txnCategory: "all",
  webSortKey: "date",
  webSortDir: "desc",
  webBudgets: {},
  webEditTxnId: null,
  trendMonthKey: "",
  trendPeriod: "6m",
  trendView: "cashflow",
  cashFlowMonthKey: "",
  viewMonthKey: "",
  // SSR defaults; reconciled to localStorage/OS by StoreProvider on mount.
  themePref: "system",
  theme: "light",
  flowStep: "booting",
});
